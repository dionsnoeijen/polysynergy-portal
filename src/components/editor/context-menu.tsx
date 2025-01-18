import React, { useEffect, useRef } from 'react';
import useEditorStore from "@/stores/editorStore";

const ContextMenu: React.FC = () => {
    const { contextMenu, closeContextMenu } = useEditorStore();
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
            style={{
                position: "absolute",
                top: `${contextMenu.y}px`,
                left: `${contextMenu.x}px`,
                zIndex: 50,
                background: "white",
                border: "1px solid #ccc",
                borderRadius: "4px",
                boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)"
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
                    className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100"
                >
                    {item.label}
                </button>
            ))}
        </div>
    );
};

export default ContextMenu;
