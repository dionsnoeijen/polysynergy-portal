import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

type InlineMarkdownEditorProps = {
    content: string;
    isEditing: boolean;
    onSave: (content: string) => void;
    onCancel: () => void;
    onStartEdit?: () => void;
    placeholder?: string;
    className?: string;
};

const InlineMarkdownEditor: React.FC<InlineMarkdownEditorProps> = ({
    content,
    isEditing,
    onSave,
    onCancel,
    onStartEdit,
    placeholder = 'Enter markdown text...',
    className = '',
}) => {
    const [editContent, setEditContent] = useState(content);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Focus textarea when entering edit mode
    useEffect(() => {
        if (isEditing && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.selectionStart = textareaRef.current.value.length;
        }
    }, [isEditing]);

    // Reset edit content when content prop changes
    useEffect(() => {
        setEditContent(content);
    }, [content]);

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCancel();
        } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            onSave(editContent);
        }
    };

    // Auto-resize textarea
    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const textarea = e.target;
        setEditContent(textarea.value);

        // Auto-resize
        textarea.style.height = 'auto';
        textarea.style.height = `${textarea.scrollHeight}px`;
    };

    if (isEditing) {
        return (
            <div className={`relative ${className}`}>
                <textarea
                    ref={textareaRef}
                    value={editContent}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className="w-full min-h-[100px] p-3 bg-white dark:bg-zinc-900 border-2 border-sky-400 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-mono text-zinc-800 dark:text-zinc-200"
                    style={{ overflow: 'hidden' }}
                />
                <button
                    type="button"
                    onClick={() => onSave(editContent)}
                    className="absolute bottom-2 right-2 px-3 py-1 text-xs font-medium text-white bg-sky-500 hover:bg-sky-600 rounded transition-colors"
                >
                    Done
                </button>
            </div>
        );
    }

    // Preview mode - double-click to edit
    return (
        <div
            className={`cursor-text min-h-[1.5em] ${className}`}
            onDoubleClick={(e) => {
                e.stopPropagation();
                onStartEdit?.();
            }}
        >
            {content ? (
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({ children }) => <h1 className="text-3xl font-bold mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-2xl font-bold mb-2">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-xl font-semibold mb-1">{children}</h3>,
                        h4: ({ children }) => <h4 className="text-lg font-semibold mb-1">{children}</h4>,
                        h5: ({ children }) => <h5 className="text-base font-medium">{children}</h5>,
                        h6: ({ children }) => <h6 className="text-sm font-medium">{children}</h6>,
                        p: ({ children }) => <p className="mb-2">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        a: ({ href, children }) => <a href={href} className="text-sky-600 underline">{children}</a>,
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        code: ({ children }) => <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded text-sm">{children}</code>,
                        blockquote: ({ children }) => <blockquote className="border-l-4 border-zinc-300 pl-4 italic">{children}</blockquote>,
                    }}
                >
                    {content}
                </ReactMarkdown>
            ) : (
                <span className="text-zinc-400 dark:text-zinc-500 italic">
                    {placeholder}
                </span>
            )}
        </div>
    );
};

export default InlineMarkdownEditor;
