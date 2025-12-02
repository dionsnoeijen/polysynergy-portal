import React, { useState } from "react";
import MarkdownContent from "@/components/editor/chat/components/markdown-content";
import TransparencyDetails from "@/components/editor/chat/components/transparency-details";
import { EyeIcon } from "@heroicons/react/24/outline";
import useEditorStore from "@/stores/editorStore";

const NodeResponseCard: React.FC<{
  nodeName: string;
  text: string;
  agentAvatar?: string | null;
  runId?: string | null;
}> = ({ nodeName, text, agentAvatar = null, runId = null }) => {
  const [showTransparency, setShowTransparency] = useState(false);
  const chatWindowPermissions = useEditorStore(s => s.chatWindowPermissions);

  // fallback initialen (max 2)
  const initials = nodeName
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="border border-sky-500/60 dark:border-slate-600/80 rounded-xl bg-white/60 dark:bg-slate-800/40 shadow-sm">
      {/* Header met avatar + naam */}
      <div className="px-3 py-2 border-b border-sky-500/40 dark:border-slate-700/80 text-xs font-medium text-slate-700 dark:text-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {agentAvatar ? (
              /* eslint-disable-next-line @next/next/no-img-element */
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
          
          {/* Transparency Button */}
          {runId && (chatWindowPermissions?.show_response_transparency !== false) && (
            <button
              onClick={() => setShowTransparency(!showTransparency)}
              className="p-1 rounded text-slate-500 hover:text-sky-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              title="Show transparency details"
            >
              <EyeIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Transparency Expansion - Moved to top under header */}
      {showTransparency && runId && (chatWindowPermissions?.show_response_transparency !== false) && (
        <div className="border-b border-sky-500/40 dark:border-slate-700/80 px-3 py-3 bg-slate-50 dark:bg-slate-900/50">
          <TransparencyDetails runId={runId} />
        </div>
      )}

      {/* Body */}
      <div className="px-3 py-2 text-sm">
        <MarkdownContent text={text} enableMarkdown />
      </div>
    </div>
  );
};

export default NodeResponseCard;