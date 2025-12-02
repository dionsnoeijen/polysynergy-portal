/**
 * Converts a hex color to rgba format with the specified opacity
 * @param hex - Hex color string (e.g., "#0ea5e9" or "0ea5e9")
 * @param opacity - Opacity value between 0 and 1
 * @returns RGBA color string (e.g., "rgba(14, 165, 233, 0.5)")
 */
export function hexToRgba(hex: string, opacity: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(14, 165, 233, ${opacity})`; // fallback to sky-500
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Extracts RGB values from a hex color
 * @param hex - Hex color string (e.g., "#0ea5e9" or "0ea5e9")
 * @returns Object with r, g, b properties
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { r: 14, g: 165, b: 233 }; // fallback to sky-500
    return {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
    };
}
