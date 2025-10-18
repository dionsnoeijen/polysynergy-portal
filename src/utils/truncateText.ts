/**
 * Truncates text to a maximum number of characters
 * @param text - The text to truncate
 * @param maxLength - Maximum number of characters (default: 50)
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string | number | boolean | null | undefined, maxLength: number = 50): string {
    if (text === null || text === undefined) {
        return '';
    }

    const stringValue = String(text);

    if (stringValue.length <= maxLength) {
        return stringValue;
    }

    return stringValue.substring(0, maxLength) + '...';
}
