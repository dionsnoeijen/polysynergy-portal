import React, { useState } from "react";
import { PencilIcon, PhotoIcon, RectangleGroupIcon, CursorArrowRaysIcon } from "@heroicons/react/24/outline";
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
  
  // Dropdown states
  const [showShapes, setShowShapes] = useState(false);
  const [showColors, setShowColors] = useState(false);
  const [showStrokeWidths, setShowStrokeWidths] = useState(false);
  
  // Drawing store
  const currentColor = useDrawingStore((state) => state.currentColor);
  const currentTool = useDrawingStore((state) => state.currentTool);
  const strokeWidth = useDrawingStore((state) => state.strokeWidth);
  const setCurrentColor = useDrawingStore((state) => state.setCurrentColor);
  const setCurrentTool = useDrawingStore((state) => state.setCurrentTool);
  const setStrokeWidth = useDrawingStore((state) => state.setStrokeWidth);
  const addNote = useDrawingStore((state) => state.addNote);


  const strokeWidths = [1, 2, 4, 6, 8, 12];
  
  const shapes = [
    { id: 'rectangle', name: 'Rectangle', icon: '□' },
    { id: 'circle', name: 'Circle', icon: '○' },
    { id: 'triangle', name: 'Triangle', icon: '△' },
    { id: 'line', name: 'Line', icon: '/' }
  ];

  // Get current active shape (default to rectangle)
  const getCurrentShape = () => {
    const shapeTools = ['rectangle', 'circle', 'triangle', 'line'];
    return shapeTools.find(shape => currentTool === shape) || 'rectangle';
  };

  const closeAllDropdowns = () => {
    setShowShapes(false);
    setShowColors(false);
    setShowStrokeWidths(false);
  };

  const showToolbar =
    editorMode === EditorMode.Draw ||
    (editorMode === EditorMode.Pan && previousEditorMode === EditorMode.Draw);

  // Close dropdowns when toolbar is hidden
  React.useEffect(() => {
    if (!showToolbar) {
      closeAllDropdowns();
    }
  }, [showToolbar]);

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
          className="absolute bottom-2 left-1/2 z-[50] bg-zinc-800/90 border border-white/25 rounded-lg shadow-lg"
          style={{ translateX: "-50%" }}
          onClick={(e) => {
            // Close dropdowns when clicking outside
            if (e.target === e.currentTarget) {
              closeAllDropdowns();
            }
          }}
        >
          {/* Main horizontal toolbar */}
          <div className="px-3 py-2 flex items-center space-x-3">
            {/* Select Tool */}
            <button
              className={`p-2 rounded hover:bg-zinc-700 transition-colors ${currentTool === 'select' ? 'bg-sky-500' : ''}`}
              onClick={() => { closeAllDropdowns(); handleSelectTool('select'); }}
              title="Select Tool (V)"
            >
              <CursorArrowRaysIcon className="w-5 h-5 text-white" />
            </button>


            {/* Shape Tool - shows active shape */}
            <div className="relative">
              <button
                className={`p-2 rounded hover:bg-zinc-700 transition-colors ${shapes.some(s => s.id === currentTool) ? 'bg-sky-500' : ''}`}
                onClick={() => {
                  setShowColors(false);
                  setShowStrokeWidths(false);
                  setShowShapes(!showShapes);
                }}
                title="Shape Tools"
              >
                <span className="text-white text-lg font-mono">
                  {shapes.find(s => s.id === getCurrentShape())?.icon || '□'}
                </span>
              </button>
              
              {/* Shapes Dropdown */}
              <AnimatePresence>
                {showShapes && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full mb-2 left-0 bg-zinc-800/95 border border-white/25 rounded-lg shadow-xl p-2 min-w-[120px]"
                  >
                    {shapes.map((shape) => (
                      <button
                        key={shape.id}
                        className={`w-full flex items-center space-x-2 p-2 rounded hover:bg-zinc-700 text-left transition-colors ${currentTool === shape.id ? 'bg-sky-500' : ''}`}
                        onClick={() => {
                          setCurrentTool(shape.id as any);
                          setShowShapes(false);
                        }}
                      >
                        <span className="text-white text-lg font-mono w-4 text-center">{shape.icon}</span>
                        <span className="text-white text-sm">{shape.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Color Tool */}
            <div className="relative">
              <button
                className="p-2 rounded hover:bg-zinc-700 transition-colors"
                onClick={() => {
                  setShowShapes(false);
                  setShowStrokeWidths(false);
                  setShowColors(!showColors);
                }}
                title="Colors"
              >
                <div 
                  className="w-5 h-5 rounded border-2 border-white" 
                  style={{ backgroundColor: currentColor }}
                />
              </button>
              
              {/* Color Picker Dropdown */}
              <AnimatePresence>
                {showColors && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full mb-2 left-0 bg-zinc-800/95 border border-white/25 rounded-lg shadow-xl p-3"
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="color"
                        value={currentColor}
                        onChange={(e) => {
                          setCurrentColor(e.target.value);
                        }}
                        className="w-12 h-8 rounded border border-gray-400 cursor-pointer bg-transparent"
                      />
                      <div className="flex flex-col">
                        <span className="text-white text-xs">{currentColor}</span>
                        <span className="text-gray-400 text-xs">Current color</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Pencil Tool with stroke width */}
            <div className="relative">
              <button 
                className={`p-2 rounded hover:bg-zinc-700 transition-colors ${currentTool === 'pen' ? 'bg-sky-500' : ''}`}
                onClick={() => {
                  if (currentTool === 'pen') {
                    setShowShapes(false);
                    setShowColors(false);
                    setShowStrokeWidths(!showStrokeWidths);
                  } else {
                    closeAllDropdowns();
                    setCurrentTool('pen');
                    setStrokeWidth(strokeWidths[strokeWidths.length - 1]); // Set to thickest by default
                  }
                }}
                title="Pencil Tool (P)"
              >
                <PencilIcon className="w-5 h-5 text-white" />
              </button>
              
              {/* Stroke Width Dropdown */}
              <AnimatePresence>
                {showStrokeWidths && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute bottom-full mb-2 left-0 bg-zinc-800/95 border border-white/25 rounded-lg shadow-xl p-2"
                  >
                    {strokeWidths.map((width) => (
                      <button
                        key={width}
                        onClick={() => {
                          setStrokeWidth(width);
                          setShowStrokeWidths(false);
                        }}
                        className={`w-full flex items-center justify-center p-2 rounded hover:bg-zinc-700 transition-colors ${strokeWidth === width ? 'bg-sky-500' : ''}`}
                        title={`${width}px thickness`}
                      >
                        <div 
                          className="bg-white rounded-full"
                          style={{ 
                            width: `${Math.max(4, Math.min(width * 2, 16))}px`, 
                            height: `${Math.max(4, Math.min(width * 2, 16))}px` 
                          }}
                        />
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Eraser Tool */}
            <button 
              className={`p-2 rounded hover:bg-zinc-700 transition-colors ${currentTool === 'eraser' ? 'bg-sky-500' : ''}`}
              onClick={() => { closeAllDropdowns(); handleSelectTool('eraser'); }}
              title="Eraser (E)"
            >
              <BackspaceIcon className="w-5 h-5 text-white" />
            </button>

            {/* Image Tool */}
            <button 
              className={`p-2 rounded hover:bg-zinc-700 transition-colors ${currentTool === 'image' ? 'bg-sky-500' : ''}`}
              onClick={() => { closeAllDropdowns(); handleImageUpload(); }}
              title="Add Image"
            >
              <PhotoIcon className="w-5 h-5 text-white" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BottomDrawToolbar;