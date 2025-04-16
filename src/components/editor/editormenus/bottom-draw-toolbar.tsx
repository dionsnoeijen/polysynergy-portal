import React, { useState } from "react";
import { PencilIcon, PhotoIcon, RectangleGroupIcon } from "@heroicons/react/24/outline";
import useEditorStore from "@/stores/editorStore";
import { EditorMode } from "@/types/types";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";

const BottomDrawToolbar: React.FC = () => {
  const editorMode = useEditorStore((state) => state.editorMode);
  const previousEditorMode = useEditorStore((state) => state.previousEditorMode);
  const [showShapes, setShowShapes] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#38bdf8");

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
            className="p-2 rounded hover:bg-zinc-700"
            onClick={() => setShowShapes(!showShapes)}
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
                onClick={() => setSelectedColor(color)}
                className={clsx(
                  "w-5 h-5 rounded-full border border-white",
                  selectedColor === color ? "ring-2 ring-white" : ""
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <button className="p-2 rounded hover:bg-zinc-700">
            <PencilIcon className="w-5 h-5 text-white" />
          </button>

          <button className="p-2 rounded hover:bg-zinc-700">
            <PhotoIcon className="w-5 h-5 text-white" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BottomDrawToolbar;