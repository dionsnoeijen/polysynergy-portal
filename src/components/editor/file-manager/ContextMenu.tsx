import React, { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ContextMenuItem } from '@/types/types';

type ContextMenuProps = {
  visible: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
  onClose: () => void;
};

const ContextMenu: React.FC<ContextMenuProps> = ({ visible, position, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const ignoreNextClick = useRef(false);

  // Computed position kept in state so we can update after measuring
  const [computedPos, setComputedPos] = useState<{ left: number; top: number }>({
    left: position.x,
    top: position.y,
  });

  // Recompute position once the menu is in the DOM
  useLayoutEffect(() => {
    if (!visible) return;

    // start with requested position
    let x = position.x;
    let y = position.y;

    const el = menuRef.current;
    if (el) {
      const { width, height } = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      if (x + width > vw) x = Math.max(0, vw - width);
      if (y + height > vh) y = Math.max(0, vh - height);
    }

    setComputedPos({ left: x, top: y });
  }, [visible, position.x, position.y]);

  // Close on outside click / escape
  useEffect(() => {
    if (!visible) return;

    ignoreNextClick.current = true;

    const handleClickOutside = (event: MouseEvent) => {
      if (ignoreNextClick.current) {
        ignoreNextClick.current = false;
        return;
      }
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  if (!visible || items.length === 0) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md shadow-lg py-1 min-w-[12rem]"
        style={{ left: computedPos.left, top: computedPos.top }}
      >
        {items.map((item, index) => (
          <React.Fragment key={index}>
            {item.divider ? (
              <hr className="my-1 border-zinc-200 dark:border-zinc-700" />
            ) : (
              <button
                className={`w-full px-4 py-2 text-left text-sm transition-colors duration-150 flex items-center gap-2
                  ${item.disabled
                    ? 'text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                    : 'text-zinc-900 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-700'}`}
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
                  <span className="w-4 h-4 shrink-0">
                    {typeof item.icon === 'string' ? <span>{item.icon}</span> : item.icon}
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