// components/editor/chat/components/message-row.tsx
import React from "react";
import { ChatViewMessage } from "@/stores/chatViewStore";
import MarkdownContent from "@/components/editor/chat/components/markdown-content";
import ReferenceDisplay from "@/components/editor/chat/components/reference-display";
import { parseMessageReferences } from "@/utils/referenceParser";

type Props = { message: ChatViewMessage };

export default function PromptRow({ message }: Props) {
  const parsed = parseMessageReferences(message.text);
  const mainText = parsed.text ?? "";
  const refs = parsed.references ?? [];

  return (
    <div className="flex flex-col items-end space-y-1">
      <div className="px-4 py-2 rounded-xl text-sm max-w-[70%] bg-blue-500 text-white">
        <MarkdownContent text={mainText} enableMarkdown={false} />
      </div>

      {refs.length > 0 && (
        <div className="max-w-[70%] text-xs text-gray-500 dark:text-gray-400">
          <ReferenceDisplay references={refs} />
        </div>
      )}
    </div>
  );
}