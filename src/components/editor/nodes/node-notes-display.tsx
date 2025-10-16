import React from "react";
import { Node } from "@/types/types";
import MarkdownContent from "@/components/editor/chat/components/markdown-content";

interface NodeNotesDisplayProps {
    node: Node;
    isCollapsed?: boolean;
}

const NodeNotesDisplay: React.FC<NodeNotesDisplayProps> = ({ node, isCollapsed = false }) => {
    console.log('👁️ NodeNotesDisplay render:', { nodeId: node.id, notes: node.notes, isCollapsed });

    // Don't render if there are no notes
    if (!node.notes || node.notes.trim() === "") {
        console.log('❌ No notes to display');
        return null;
    }

    console.log('✅ Displaying notes');

    // For collapsed nodes/groups, use negative margin to compensate for container padding
    const containerClass = isCollapsed
        ? "-mx-[0.86rem] -mt-[0.86rem] bg-amber-50/80 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/50 rounded-t-lg text-xs mb-3"
        : "bg-amber-50/80 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800/50 rounded-t-lg text-xs mb-3";

    return (
        <div className={containerClass}>
            <div className="p-2 text-amber-800 dark:text-amber-300 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-300 dark:scrollbar-thumb-amber-700 scrollbar-track-transparent">
                <MarkdownContent
                    text={node.notes}
                    className="text-xs [&_*]:text-amber-800 dark:[&_*]:text-amber-300 [&_a]:text-amber-600 dark:[&_a]:text-amber-400 [&_code]:bg-amber-100 dark:[&_code]:bg-amber-800/50 [&_h1]:text-base [&_h1]:font-bold [&_h2]:text-sm [&_h2]:font-bold [&_h3]:text-xs [&_h3]:font-bold"
                />
            </div>
        </div>
    );
};

export default NodeNotesDisplay;
