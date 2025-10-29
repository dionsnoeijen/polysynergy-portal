import { Package } from '@/types/types';

/**
 * Clipboard utility functions for cross-application copy/paste
 *
 * Uses modern Clipboard API with legacy fallback for older browsers
 */

interface ClipboardPackage {
  __polysynergy__: true;
  version: string;
  timestamp: number;
  package: Package;
}

/**
 * Copy a node package to the system clipboard
 * Enables cross-tab and cross-application paste
 *
 * @param data - The package data to copy
 * @returns Promise<boolean> - true if successful, false otherwise
 */
export async function copyToClipboard(data: Package): Promise<boolean> {
  try {
    // Wrap package with metadata marker
    const clipboardData: ClipboardPackage = {
      __polysynergy__: true,
      version: '1.0',
      timestamp: Date.now(),
      package: data
    };

    const jsonString = JSON.stringify(clipboardData);

    // Try modern Clipboard API first (requires HTTPS or localhost)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(jsonString);
      console.log('✅ [Clipboard] Copied to system clipboard (Clipboard API)');
      return true;
    }

    // Fallback to legacy execCommand
    return copyToClipboardLegacy(jsonString);

  } catch (error) {
    console.error('❌ [Clipboard] Failed to copy:', error);

    // Try legacy fallback on error
    try {
      const clipboardData: ClipboardPackage = {
        __polysynergy__: true,
        version: '1.0',
        timestamp: Date.now(),
        package: data
      };
      return copyToClipboardLegacy(JSON.stringify(clipboardData));
    } catch (fallbackError) {
      console.error('❌ [Clipboard] Legacy fallback also failed:', fallbackError);
      return false;
    }
  }
}

/**
 * Paste a node package from the system clipboard
 * Reads PolySynergy-formatted data from clipboard
 *
 * @returns Promise<Package | null> - The package data or null if not available
 */
export async function pasteFromClipboard(): Promise<Package | null> {
  try {
    let text: string;

    // Try modern Clipboard API first
    if (navigator.clipboard && navigator.clipboard.readText) {
      text = await navigator.clipboard.readText();
    } else {
      // Legacy method doesn't support reading clipboard
      // Browser security prevents reading clipboard without user action
      console.warn('⚠️ [Clipboard] Clipboard API not available, cannot paste from system clipboard');
      return null;
    }

    if (!text || text.trim() === '') {
      return null;
    }

    // Try to parse as JSON
    const data = JSON.parse(text);

    // Check if it's a PolySynergy package
    if (data.__polysynergy__ && data.package) {
      console.log('✅ [Clipboard] Pasted from system clipboard');
      return data.package;
    }

    // Not a PolySynergy package
    console.log('ℹ️ [Clipboard] Clipboard content is not a PolySynergy package');
    return null;

  } catch (error) {
    // Silent fail - clipboard might contain non-JSON data
    if (error instanceof SyntaxError) {
      // Not JSON, that's fine
      return null;
    }

    console.error('❌ [Clipboard] Failed to paste:', error);
    return null;
  }
}

/**
 * Legacy fallback for copying to clipboard
 * Uses deprecated execCommand but works in older browsers
 *
 * @param text - The text to copy
 * @returns boolean - true if successful
 */
function copyToClipboardLegacy(text: string): boolean {
  try {
    // Create invisible textarea
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    textarea.style.top = '-999999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);

    // Select and copy
    textarea.focus();
    textarea.select();

    const success = document.execCommand('copy');

    // Cleanup
    document.body.removeChild(textarea);

    if (success) {
      console.log('✅ [Clipboard] Copied to system clipboard (legacy execCommand)');
    } else {
      console.error('❌ [Clipboard] execCommand failed');
    }

    return success;

  } catch (error) {
    console.error('❌ [Clipboard] Legacy copy failed:', error);
    return false;
  }
}

/**
 * Check if Clipboard API is available
 *
 * @returns boolean - true if Clipboard API is supported
 */
export function isClipboardAPIAvailable(): boolean {
  return typeof navigator !== 'undefined' &&
         !!navigator.clipboard &&
         typeof navigator.clipboard.writeText === 'function' &&
         typeof navigator.clipboard.readText === 'function';
}
