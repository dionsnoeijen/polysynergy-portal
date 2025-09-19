interface ReferenceItem {
    meta_data?: {
        page?: number;
        source?: string; // Legacy support
        document_name?: string;
        source_url?: string;
        [key: string]: unknown;
    };
    name?: string;
    content: string;
}

export interface ParsedMessage {
    text: string;
    references?: ReferenceItem[];
}

/**
 * Parse a chat message to extract references and clean text
 */
export function parseMessageReferences(messageText: string): ParsedMessage {
    if (!messageText) {
        return { text: messageText };
    }

    const references: ReferenceItem[] = [];
    let cleanText = messageText;

    // Try to find and extract JSON arrays containing meta_data - more flexible approach
    // Look for patterns starting with [ and containing "meta_data"
    const jsonMatches = messageText.match(/\[[^[]*?"meta_data"[^[]*?\]/g);
    
    if (jsonMatches) {
        for (const match of jsonMatches) {
            try {
                // Clean up the match to make it valid JSON
                const jsonString = match.trim();
                
                // Try to parse as JSON
                const parsed = JSON.parse(jsonString);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Check if this looks like a reference array
                    const isReferenceArray = parsed.every(item => 
                        item && 
                        typeof item === 'object' && 
                        'content' in item &&
                        typeof item.content === 'string' &&
                        'meta_data' in item
                    );
                    
                    if (isReferenceArray) {
                        references.push(...parsed);
                        // Remove this JSON from the main text
                        cleanText = cleanText.replace(match, '').trim();
                    }
                }
            } catch {
                // If that fails, try a more aggressive approach to find the JSON boundaries
                try {
                    // Find the start of the array
                    const startIdx = messageText.indexOf('[');
                    if (startIdx === -1) continue;
                    
                    // Find the matching closing bracket by counting brackets
                    let bracketCount = 0;
                    let endIdx = -1;
                    for (let i = startIdx; i < messageText.length; i++) {
                        if (messageText[i] === '[') bracketCount++;
                        if (messageText[i] === ']') bracketCount--;
                        if (bracketCount === 0) {
                            endIdx = i;
                            break;
                        }
                    }
                    
                    if (endIdx !== -1) {
                        const fullMatch = messageText.substring(startIdx, endIdx + 1);
                        const parsed = JSON.parse(fullMatch);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            const isReferenceArray = parsed.every(item => 
                                item && 
                                typeof item === 'object' && 
                                'content' in item &&
                                typeof item.content === 'string' &&
                                'meta_data' in item
                            );
                            
                            if (isReferenceArray) {
                                references.push(...parsed);
                                cleanText = cleanText.replace(fullMatch, '').trim();
                            }
                        }
                    }
                } catch (innerError) {
                    console.warn('Failed to parse potential reference JSON:', innerError);
                }
            }
        }
    }

    // Clean up any leftover formatting issues and reference wrapper
    cleanText = cleanText
        .replace(/<references>[\s\S]*?<\/references>/g, '') // Remove empty reference tags
        .replace(/<references>[\s\S]*/g, '') // Remove opening reference tag
        .replace(/[\s\S]*?<\/references>/g, '') // Remove closing reference tag
        .replace(/Use the following references from the knowledge base if it helps:/g, '')
        .replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space, but preserve newlines
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Triple+ newlines to double newlines
        .trim();

    const result: ParsedMessage = { text: cleanText };
    if (references.length > 0) {
        result.references = references;
    }

    return result;
}

/**
 * Check if a string contains reference-like JSON
 */
export function hasReferences(text: string): boolean {
    return /\[\s*\{\s*[^}]*"meta_data"\s*:/.test(text);
}