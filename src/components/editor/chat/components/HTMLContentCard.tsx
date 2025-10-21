import React from 'react';
import DOMPurify from 'dompurify';

interface HTMLContentCardProps {
    htmlContent: string;
}

/**
 * Component for rendering sanitized HTML content in chat messages.
 * Uses DOMPurify to sanitize HTML and prevent XSS attacks.
 */
export const HTMLContentCard: React.FC<HTMLContentCardProps> = ({ htmlContent }) => {
    // Sanitize HTML content to prevent XSS
    const sanitizedHTML = DOMPurify.sanitize(htmlContent, {
        ALLOWED_TAGS: [
            // Text formatting
            'p', 'br', 'strong', 'em', 'u', 's', 'span', 'div',
            'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            // Lists
            'ul', 'ol', 'li',
            // Tables
            'table', 'thead', 'tbody', 'tr', 'th', 'td',
            // Images
            'img',
            // Links
            'a',
            // Code
            'code', 'pre',
            // Other
            'blockquote', 'hr',
        ],
        ALLOWED_ATTR: [
            // Common attributes
            'class', 'id', 'style',
            // Image attributes
            'src', 'alt', 'width', 'height',
            // Link attributes
            'href', 'target', 'rel',
            // Table attributes
            'colspan', 'rowspan',
        ],
        ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp|data):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    });

    return (
        <div className="html-content-card bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4 my-3 shadow-sm">
            <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
            />
        </div>
    );
};
