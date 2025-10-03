import React, { useEffect, useRef } from 'react';
import useEditorStore from "@/stores/editorStore";

const ContextMenu: React.FC = () => {
    const contextMenu = useEditorStore((state) => state.contextMenu);
    const closeContextMenu = useEditorStore((state) => state.closeContextMenu);

    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                closeContextMenu();
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [closeContextMenu]);

    if (!contextMenu.visible) return null;

    return (
        <div
            ref={menuRef}
            className="absolute z-50 bg-sky-50 dark:bg-zinc-800/80 border border-sky-500/60 dark:border-white/25 rounded shadow-lg"
            style={{
                top: `${contextMenu.y}px`,
                left: `${contextMenu.x}px`,
            }}
            onClick={(e) => e.stopPropagation()}
        >
            {contextMenu.items.map((item, index) => (
                <button
                    key={index}
                    onClick={() => {
                        item.action();
                        closeContextMenu();
                    }}
                    className="block w-full px-4 py-2 text-left text-zinc-700 dark:text-white hover:bg-sky-100 dark:hover:bg-zinc-600"
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
};

export default ContextMenu;
