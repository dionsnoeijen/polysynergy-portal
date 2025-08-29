import React, { memo, useEffect, useRef } from 'react';
import { ContextMenuItem } from '@/types/types';

type ContextMenuProps = {
    visible: boolean;
    position: { x: number; y: number };
    items: ContextMenuItem[];
    onClose: () => void;
};

const ContextMenu: React.FC<ContextMenuProps> = ({
    visible,
    position,
    items,
    onClose
}) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const ignoreNextClick = useRef(false);

    // Close menu when clicking outside
    useEffect(() => {
        if (!visible) return;

        // Ignore the first click that opened the menu
        ignoreNextClick.current = true;

        const handleClickOutside = (event: MouseEvent) => {
            // Ignore the click that opened the context menu
            if (ignoreNextClick.current) {
                ignoreNextClick.current = false;
                return;
            }
            
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        // Close on escape key
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [visible, onClose]);

    // Adjust menu position to stay within viewport
    const getMenuStyle = () => {
        if (!visible || !menuRef.current) {
            return { 
                left: position.x, 
                top: position.y,
                visibility: 'hidden' as const
            };
        }

        const menuRect = menuRef.current.getBoundingClientRect();
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        };

        let { x, y } = position;

        // Adjust horizontal position
        if (x + menuRect.width > viewport.width) {
            x = Math.max(0, viewport.width - menuRect.width);
        }

        // Adjust vertical position
        if (y + menuRect.height > viewport.height) {
            y = Math.max(0, viewport.height - menuRect.height);
        }

        return { 
            left: x, 
            top: y,
            visibility: 'visible' as const
        };
    };

    if (!visible || items.length === 0) {
        return null;
    }

    return (
        <>
            {/* Backdrop */}
            <div 
                className="fixed inset-0 z-40"
                onClick={onClose}
            />
            
            {/* Menu */}
            <div
                ref={menuRef}
                className="fixed z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg py-1 min-w-48"
                style={getMenuStyle()}
            >
                {items.map((item, index) => (
                    <React.Fragment key={index}>
                        {item.divider ? (
                            <hr className="my-1 border-zinc-200 dark:border-zinc-700" />
                        ) : (
                            <button
                                className={`
                                    w-full px-4 py-2 text-left text-sm transition-colors duration-150 flex items-center space-x-2
                                    ${item.disabled 
                                        ? 'text-zinc-400 dark:text-zinc-500 cursor-not-allowed' 
                                        : 'text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                                    }
                                `}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!item.disabled && item.action) {
                                        item.action();
                                        onClose();
                                    }
                                }}
                                disabled={item.disabled}
                            >
                                {item.icon && (
                                    <span className="w-4 h-4 flex-shrink-0">
                                        {typeof item.icon === 'string' ? (
                                            <span>{item.icon}</span>
                                        ) : (
                                            item.icon
                                        )}
                                    </span>
                                )}
                                <span>{item.label}</span>
                            </button>
                        )}
                    </React.Fragment>
                ))}
            </div>
        </>
    );
};

export default memo(ContextMenu);