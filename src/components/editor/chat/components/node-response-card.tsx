import React from "react";
import MarkdownContent from "@/components/editor/chat/components/markdown-content";

const NodeResponseCard: React.FC<{
  nodeName: string;
  text: string;
  agentAvatar?: string | null;
}> = ({ nodeName, text, agentAvatar = null }) => {
  // fallback initialen (max 2)
  const initials = nodeName
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="border border-slate-300/60 dark:border-slate-600/60 rounded-xl bg-white/60 dark:bg-slate-800/40 shadow-sm">
      {/* Header met avatar + naam */}
      <div className="px-3 py-2 border-b border-slate-200/60 dark:border-slate-700/60 text-xs font-medium text-slate-700 dark:text-slate-200">
        <div className="flex items-center gap-2">
          {agentAvatar ? (
            <img
              src={agentAvatar}
              alt={nodeName}
              className="w-5 h-5 rounded-full object-cover flex-shrink-0"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-sky-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
              {initials || "A"}
            </div>
          )}
          <span className="truncate">{nodeName}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-3 py-2 text-sm">
        <MarkdownContent text={text} enableMarkdown />
      </div>
    </div>
  );
};

export default NodeResponseCard;