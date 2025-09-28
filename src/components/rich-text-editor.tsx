import React, {useEffect, useState} from "react";
import {Editor, EditorState, RichUtils} from "draft-js";
import {stateToHTML} from "draft-js-export-html";
import {stateFromHTML} from 'draft-js-import-html';
import "draft-js/dist/Draft.css";
import {BoldIcon, ItalicIcon, ListBulletIcon, NumberedListIcon, UnderlineIcon} from "@heroicons/react/24/outline";
import clsx from "clsx";

interface RichTextEditorProps {
    disabled?: boolean;
    value?: string;
    onChange: (html: string) => void;
    categoryBorder?: string;
    categoryMainTextColor?: string;
    categorySubTextColor?: string;
    categoryBackgroundColor?: string;
    categoryGradientBackgroundColor?: string;
};

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

const RichTextEditor: React.FC<RichTextEditorProps> = ({
    disabled = false,
    value = "",
    onChange,
    categoryBorder = 'border border-sky-200 dark:border-zinc-700',
    // eslint-disable-next-line
    categoryMainTextColor = 'text-sky-500 dark:text-white/70',
    // eslint-disable-next-line
    categorySubTextColor = 'text-sky-800 dark:text-white/70',
    // categoryBackgroundColor = 'bg-white dark:bg-zinc-800 shadow-sm',
    // eslint-disable-next-line
    categoryGradientBackgroundColor = 'bg-gradient-to-r from-sky-100 to-sky-200 dark:from-zinc-800 dark:to-zinc-900'
}) => {
    const [editorState, setEditorState] = useState(() => createEditorStateFromValue(value));

    useEffect(() => {
        const currentHTML = stateToHTML(editorState.getCurrentContent());
        if (currentHTML !== value) {
            setEditorState(createEditorStateFromValue(value));
        }
        // eslint-disable-next-line
    }, [value]);

    const handleEditorChange = (state: EditorState) => {
        setEditorState(state);
        const content = state.getCurrentContent();
        const isEmpty = !content.hasText() && content.getBlockMap().first()?.getType() === "unstyled";
        const htmlContent = isEmpty ? "" : stateToHTML(content);
        onChange(htmlContent);
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

    const currentInlineStyle = editorState.getCurrentInlineStyle();
    const currentBlockType = RichUtils.getCurrentBlockType(editorState);

    return (
        <div
            className={`relative border ${categoryBorder} bg-transparent dark:bg-white/5 p-3 min-h-52 rounded-md`}>
            {disabled && (
                <div className="absolute inset-0 bg-sky-50/60 dark:bg-black/40 rounded-md z-10 pointer-events-none"/>
            )}
            <div className="flex gap-2 mb-3">
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

            <Editor
                editorState={editorState}
                onChange={handleEditorChange}
                handleKeyCommand={handleKeyCommand}
                placeholder="Write your description here..."
            />
        </div>
    );
};

export default RichTextEditor;