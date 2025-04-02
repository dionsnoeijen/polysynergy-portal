import React, {useEffect, useState} from "react";
import { Editor, EditorState, RichUtils } from "draft-js";
import { stateToHTML } from "draft-js-export-html";
import { stateFromHTML } from 'draft-js-import-html';
import "draft-js/dist/Draft.css";
import { BoldIcon, ItalicIcon, ListBulletIcon, NumberedListIcon, UnderlineIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/button";

interface RichTextEditorProps {
  value?: string;
  onChange: (html: string) => void;
}

const createEditorStateFromValue = (value?: string): EditorState => {
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

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value = "", onChange }) => {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newState: any = RichUtils.handleKeyCommand(state, command);
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
    <div className="border border-white/10 bg-zinc-700/40 p-3 min-h-52 rounded-md">
      <div className="flex gap-2 mb-3">
        <Button
          plain
          type="button"
          className={currentInlineStyle.has("BOLD") ? "bg-zinc-900" : ""}
          onMouseDown={(e: React.MouseEvent) => {
            e.preventDefault();
            toggleInlineStyle("BOLD");
          }}
        >
          <BoldIcon className="h-5 w-5" />
        </Button>
        <Button
          plain
          type="button"
          className={currentInlineStyle.has("ITALIC") ? "bg-zinc-900" : ""}
          onMouseDown={(e: React.MouseEvent) => {
            e.preventDefault();
            toggleInlineStyle("ITALIC");
          }}
        >
          <ItalicIcon className="h-5 w-5" />
        </Button>
        <Button
          plain
          type="button"
          className={currentInlineStyle.has("UNDERLINE") ? "bg-zinc-900" : ""}
          onMouseDown={(e: React.MouseEvent) => {
            e.preventDefault();
            toggleInlineStyle("UNDERLINE");
          }}
        >
          <UnderlineIcon className="h-5 w-5" />
        </Button>
        <Button
          plain
          type="button"
          className={currentBlockType === "unordered-list-item" ? "bg-zinc-900" : ""}
          onMouseDown={(e: React.MouseEvent) => {
            e.preventDefault();
            toggleBlockType("unordered-list-item");
          }}
        >
          <ListBulletIcon className="h-5 w-5" />
        </Button>
        <Button
          plain
          type="button"
          className={currentBlockType === "ordered-list-item" ? "bg-zinc-900" : ""}
          onMouseDown={(e: React.MouseEvent) => {
            e.preventDefault();
            toggleBlockType("ordered-list-item");
          }}
        >
          <NumberedListIcon className="h-5 w-5" />
        </Button>
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