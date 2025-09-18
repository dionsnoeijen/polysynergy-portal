/**
 * Centralized Z-Index Management
 * 
 * This file defines a consistent z-index hierarchy for the entire application.
 * Use these values instead of hardcoded z-index classes.
 */

export const Z_INDEX = {
  // Base layers (0-9)
  BASE: 0,
  GRID: 1,
  
  // Content layers (10-19)
  NODES: 10,
  CONNECTIONS: 15,
  
  // Interactive elements (20-39)
  NODES_SELECTED: 20,
  DRAG_OVERLAY: 25,
  DOCK_CONTENT: 30,
  
  // UI Controls (40-59)
  BOTTOM_TOOLBAR: 40,
  EXECUTION_STATUS: 45,
  MENUS: 50,
  
  // Dropdowns and tooltips (60-79)
  DROPDOWNS: 60,
  TOOLTIPS: 65,
  CONTEXT_MENUS: 70,
  
  // Modals and overlays (80-99)
  MODAL_BACKDROP: 80,
  MODALS: 85,
  LOADING_OVERLAY: 90,
  
  // System notifications (100+)
  NOTIFICATIONS: 100,
  CLIPBOARD_INDICATOR: 110,
  AUTOSAVE_INDICATOR: 120,
} as const;

/**
 * Helper function to get Tailwind z-index class
 */
export function getZIndexClass(level: keyof typeof Z_INDEX): string {
  const value = Z_INDEX[level];
  
  if (value <= 50) {
    return `z-${value}`;
  }
  
  // For values > 50, use bracket notation
  return `z-[${value}]`;
}

/**
 * CSS custom properties for inline styles
 */
export function getZIndexStyle(level: keyof typeof Z_INDEX): { zIndex: number } {
  return { zIndex: Z_INDEX[level] };
}