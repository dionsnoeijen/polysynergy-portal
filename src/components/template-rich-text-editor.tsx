import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Editor, EditorState, RichUtils } from "draft-js";
import { stateToHTML } from "draft-js-export-html";
import { stateFromHTML } from 'draft-js-import-html';
import "draft-js/dist/Draft.css";
import { BoldIcon, ItalicIcon, ListBulletIcon, NumberedListIcon, UnderlineIcon } from "@heroicons/react/24/outline";
import { XMarkIcon } from '@heroicons/react/20/solid';
import clsx from "clsx";

interface TemplateRichTextEditorProps {
    disabled?: boolean;
    value?: string;
    onChange: (html: string) => void;
    categoryBorder?: string;
    categoryMainTextColor?: string;
    categorySubTextColor?: string;
    categoryBackgroundColor?: string;
    categoryGradientBackgroundColor?: string;
}

interface VariableChip {
    id: string;
    handle: string;
    startPos: number;
    endPos: number;
}

const createEditorStateFromValue = (
    value?: string,
): EditorState => {
    if (!value || value.trim() === "") {
        return EditorState.createEmpty();
    }

    try {
        const content = stateFromHTML(value);
        if (!content?.getBlockMap) throw new Error("Invalid content");
        return EditorState.createWithContent(content);
    } catch (e) {
        console.warn("Draft parse failed, using empty editor:", e);
        return EditorState.createEmpty();
    }
};

const TemplateRichTextEditor: React.FC<TemplateRichTextEditorProps> = ({
    disabled = false,
    value = "",
    onChange,
    // categoryBorder = 'border border-sky-200 dark:border-zinc-700',
    // eslint-disable-next-line
    categoryMainTextColor = 'text-sky-500 dark:text-white/70',
    // eslint-disable-next-line
    categorySubTextColor = 'text-sky-800 dark:text-white/70',
    // eslint-disable-next-line
    categoryBackgroundColor = 'bg-white dark:bg-zinc-800 shadow-sm',
    // eslint-disable-next-line
    categoryGradientBackgroundColor = 'bg-gradient-to-r from-sky-100 to-sky-200 dark:from-zinc-800 dark:to-zinc-900'
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editorState, setEditorState] = useState(() => createEditorStateFromValue(value));
    const editorRef = useRef<Editor>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout>();

    useEffect(() => {
        if (!isEditing) {
            setEditorState(createEditorStateFromValue(value));
        }
    }, [value, isEditing]);

    // Cleanup debounce timeout on unmount
    useEffect(() => {
        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, []);

    // Memoize variable parsing to avoid expensive regex operations
    const parsedVariables = useMemo(() => {
        const variables: VariableChip[] = [];
        const regex = /\{\{\s*([^}]+?)\s*\}\}/g;
        let match;
        
        while ((match = regex.exec(value)) !== null) {
            variables.push({
                id: `${match.index}-${match[1]}`,
                handle: match[1].trim(),
                startPos: match.index,
                endPos: match.index + match[0].length
            });
        }
        
        return variables;
    }, [value]);

    const removeVariable = (variable: VariableChip) => {
        const newValue = value.slice(0, variable.startPos) + value.slice(variable.endPos);
        onChange(newValue);
    };

    const debouncedOnChange = useCallback((htmlContent: string) => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = setTimeout(() => {
            onChange(htmlContent);
        }, 300); // 300ms debounce
    }, [onChange]);

    const handleEditorChange = useCallback((state: EditorState) => {
        setEditorState(state);
        const content = state.getCurrentContent();
        const isEmpty = !content.hasText() && content.getBlockMap().first()?.getType() === "unstyled";
        const htmlContent = isEmpty ? "" : stateToHTML(content);
        debouncedOnChange(htmlContent);
    }, [debouncedOnChange]);

    // const handleEditBlur = (e: React.FocusEvent) => {
    //     // Check if the new focus target is still within the editor
    //     const currentTarget = e.currentTarget;
    //     const relatedTarget = e.relatedTarget as Node;
    //     
    //     // If clicking outside the editor container, exit edit mode
    //     if (!relatedTarget || !currentTarget.contains(relatedTarget)) {
    //         setIsEditing(false);
    //     }
    // };

    // const handleEditKeyDown = (e: React.KeyboardEvent) => {
    //     if (e.key === 'Escape') {
    //         setIsEditing(false);
    //     }
    // };

    // Handle clicks outside the editor
    useEffect(() => {
        if (!isEditing) return;

        const handleClickOutside = (event: MouseEvent) => {
            const editorContainer = document.querySelector('[data-editor-container]');
            if (editorContainer && !editorContainer.contains(event.target as Node)) {
                setIsEditing(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isEditing]);

    const handleContainerClick = () => {
        if (!disabled && !isEditing) {
            setIsEditing(true);
            // Focus editor after state update
            setTimeout(() => {
                if (editorRef.current) {
                    editorRef.current.focus();
                }
            }, 0);
        }
    };

    const handleKeyCommand = (command: string, state: EditorState) => {
        const newState = RichUtils.handleKeyCommand(state, command) as unknown as EditorState;
        if (newState) {
            setEditorState(newState);
            const htmlContent = stateToHTML(newState.getCurrentContent());
            onChange(htmlContent);
            return "handled";
        }
        return "not-handled";
    };

    const toggleInlineStyle = (style: string) => {
        const newState = RichUtils.toggleInlineStyle(editorState, style);
        setEditorState(newState);
        const htmlContent = stateToHTML(newState.getCurrentContent());
        onChange(htmlContent);
    };

    const toggleBlockType = (blockType: string) => {
        const newState = RichUtils.toggleBlockType(editorState, blockType);
        setEditorState(newState);
        const htmlContent = stateToHTML(newState.getCurrentContent());
        onChange(htmlContent);
    };

    // Helper function to convert HTML to inline
    const htmlToInline = (html: string) => {
        return html
            .replace(/<p>/g, '')
            .replace(/<\/p>/g, '')
            .replace(/<div>/g, '')
            .replace(/<\/div>/g, '')
            .replace(/<br\s*\/?>/g, ' ')
            .trim();
    };

    // Memoize preview content rendering
    const previewContent = useMemo(() => {
        if (parsedVariables.length === 0) {
            return (
                <div className="text-zinc-500 dark:text-zinc-400 pointer-events-none">
                    {value ? (
                        <span dangerouslySetInnerHTML={{ __html: htmlToInline(value) }} />
                    ) : (
                        "Click to edit rich text..."
                    )}
                </div>
            );
        }

        const parts = [];
        let lastIndex = 0;

        parsedVariables.forEach((variable, index) => {
            // Add HTML before variable (convert to inline)
            if (variable.startPos > lastIndex) {
                const htmlPart = value.slice(lastIndex, variable.startPos);
                if (htmlPart) {
                    const inlineHtml = htmlToInline(htmlPart);
                    if (inlineHtml) {
                        parts.push(
                            <span 
                                key={`html-${index}`}
                                dangerouslySetInnerHTML={{ __html: inlineHtml }}
                            />
                        );
                    }
                }
            }

            // Add variable chip with better inline styling
            parts.push(
                <span
                    key={variable.id}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 rounded text-xs font-mono border border-sky-200 dark:border-sky-700/50"
                    style={{ 
                        verticalAlign: 'middle',
                        display: 'inline-flex',
                        lineHeight: '1'
                    }}
                >
                    <span className="truncate max-w-[120px]">{variable.handle}</span>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            removeVariable(variable);
                        }}
                        className="flex-shrink-0 text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-200 transition-colors ml-1"
                        title="Remove variable"
                    >
                        <XMarkIcon className="w-2.5 h-2.5" />
                    </button>
                </span>
            );

            lastIndex = variable.endPos;
        });

        // Add remaining HTML (convert to inline)
        if (lastIndex < value.length) {
            const remainingHtml = value.slice(lastIndex);
            if (remainingHtml) {
                const inlineHtml = htmlToInline(remainingHtml);
                if (inlineHtml) {
                    parts.push(
                        <span 
                            key="remaining"
                            dangerouslySetInnerHTML={{ __html: inlineHtml }}
                        />
                    );
                }
            }
        }

        return (
            <span style={{ display: 'inline' }}>
                {parts}
            </span>
        );
    }, [value, parsedVariables]);

    const currentInlineStyle = editorState.getCurrentInlineStyle();
    const currentBlockType = RichUtils.getCurrentBlockType(editorState);

    return (
        <span
            data-slot="control"
            className={clsx([
                'relative block w-full',
                // Background color + shadow applied to inset pseudo element
                'before:absolute before:inset-px before:rounded-[calc(theme(borderRadius.lg)-1px)] before:bg-white before:shadow',
                'dark:before:hidden',
                // Focus ring
                'after:pointer-events-none after:absolute after:inset-0 after:rounded-lg after:ring-inset after:ring-transparent',
                isEditing && 'sm:after:ring-2 sm:after:ring-blue-500',
                // Disabled state
                disabled && 'opacity-50 before:bg-zinc-950/5 before:shadow-none',
            ])}
            onClick={handleContainerClick}
        >
            {isEditing ? (
                <div 
                    className="relative border border-zinc-950/10 hover:border-zinc-950/20 dark:border-white/10 dark:hover:border-white/20 bg-transparent dark:bg-white/5 rounded-lg"
                    data-editor-container
                    tabIndex={-1}
                >
                    {/* Rich Text Editor Toolbar */}
                    <div className="flex gap-2 p-3 pb-2 border-b border-zinc-200 dark:border-zinc-700">
                        <button
                            type="button"
                            className={clsx(
                                "w-8 h-8 p-1 flex items-center justify-center rounded-sm transition-colors",
                                currentInlineStyle.has("BOLD")
                                    ? "bg-sky-400 dark:bg-zinc-900"
                                    : "hover:bg-sky-100 dark:hover:bg-zinc-800"
                            )}
                            onMouseDown={(e: React.MouseEvent) => {
                                e.preventDefault();
                                toggleInlineStyle("BOLD");
                            }}
                        >
                            <BoldIcon className="h-4 w-4 text-sky-600 dark:text-white" />
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e: React.MouseEvent) => {
                                e.preventDefault();
                                toggleInlineStyle("ITALIC");
                            }}
                            className={clsx(
                                "w-8 h-8 p-1 flex items-center justify-center rounded-sm transition-colors",
                                currentInlineStyle.has("ITALIC")
                                    ? "bg-sky-400 dark:bg-zinc-900"
                                    : "hover:bg-sky-100 dark:hover:bg-zinc-800"
                            )}
                        >
                            <ItalicIcon className="h-4 w-4 text-sky-600 dark:text-white" />
                        </button>
                        <button
                            type="button"
                            className={clsx(
                                "w-8 h-8 p-1 flex items-center justify-center rounded-sm transition-colors",
                                currentInlineStyle.has("UNDERLINE")
                                    ? "bg-sky-400 dark:bg-zinc-900"
                                    : "hover:bg-sky-100 dark:hover:bg-zinc-800"
                            )}
                            onMouseDown={(e: React.MouseEvent) => {
                                e.preventDefault();
                                toggleInlineStyle("UNDERLINE");
                            }}
                        >
                            <UnderlineIcon className="h-4 w-4 text-sky-600 dark:text-white" />
                        </button>
                        <button
                            type="button"
                            className={clsx(
                                "w-8 h-8 p-1 flex items-center justify-center rounded-sm transition-colors",
                                currentBlockType === "unordered-list-item"
                                    ? "bg-sky-400 dark:bg-zinc-900"
                                    : "hover:bg-sky-100 dark:hover:bg-zinc-800"
                            )}
                            onMouseDown={(e: React.MouseEvent) => {
                                e.preventDefault();
                                toggleBlockType("unordered-list-item");
                            }}
                        >
                            <ListBulletIcon className="h-4 w-4 text-sky-600 dark:text-white" />
                        </button>
                        <button
                            type="button"
                            className={clsx(
                                "w-8 h-8 p-1 flex items-center justify-center rounded-sm transition-colors",
                                currentBlockType === "ordered-list-item"
                                    ? "bg-sky-400 dark:bg-zinc-900"
                                    : "hover:bg-sky-100 dark:hover:bg-zinc-800"
                            )}
                            onMouseDown={(e: React.MouseEvent) => {
                                e.preventDefault();
                                toggleBlockType("ordered-list-item");
                            }}
                        >
                            <NumberedListIcon className="h-4 w-4 text-sky-600 dark:text-white" />
                        </button>
                    </div>

                    {/* Editor */}
                    <div className="p-3 min-h-[6rem]">
                        <Editor
                            ref={editorRef}
                            editorState={editorState}
                            onChange={handleEditorChange}
                            handleKeyCommand={handleKeyCommand}
                            placeholder="Write your content here... Use {{ variable }} for templates."
                        />
                    </div>

                    {disabled && (
                        <div className="absolute inset-0 bg-sky-50/60 dark:bg-black/40 rounded-md z-10 pointer-events-none"/>
                    )}
                </div>
            ) : (
                <div className="relative border border-zinc-950/10 hover:border-zinc-950/20 dark:border-white/10 dark:hover:border-white/20 bg-transparent dark:bg-white/5 rounded-lg cursor-text">
                    {/* Preview content with same structure as editor */}
                    <div className="p-3 min-h-[6rem] text-base/6 text-zinc-950 sm:text-sm/6 dark:text-white">
                        {previewContent}
                    </div>
                </div>
            )}
        </span>
    );
};

// interface VariableChipProps {
//     handle: string;
//     onRemove: () => void;
// }

// const VariableChipComponent: React.FC<VariableChipProps> = ({ handle, onRemove }) => {
//     return (
//         <span className="inline-flex items-center gap-1 px-2 py-0.5 mx-0.5 bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-200 rounded-md text-sm font-mono border border-sky-200 dark:border-sky-700/50">
//             <span className="truncate max-w-[200px]">{handle}</span>
//             <button
//                 onClick={(e) => {
//                     e.stopPropagation();
//                     onRemove();
//                 }}
//                 className="flex-shrink-0 text-sky-600 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-200 transition-colors"
//                 title="Remove variable"
//             >
//                 <XMarkIcon className="w-3 h-3" />
//             </button>
//         </span>
//     );
// };

export default React.memo(TemplateRichTextEditor);