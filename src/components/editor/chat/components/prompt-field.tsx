import React, {useState} from "react";
import {ArrowUpIcon, PaperClipIcon, XMarkIcon} from "@heroicons/react/24/outline";
import {PromptNodeInfo} from "@/types/types";
import useNodesStore from "@/stores/nodesStore";
import useEditorStore from "@/stores/editorStore";
import {useHandlePlay} from "@/hooks/editor/useHandlePlay";
import useChatViewStore from "@/stores/chatViewStore";
import {createFileManagerApi} from "@/api/fileManagerApi";

interface PromptFieldProps {
    promptNodes: PromptNodeInfo[];
    selectedPromptNodeId: string;
}

interface AttachedFile {
    path: string;
    name: string;
    type: 'audio' | 'image' | 'video' | 'file';
    size?: number;
}

const PromptField: React.FC<PromptFieldProps> = ({
    promptNodes,
    selectedPromptNodeId,
}) => {
    const [input, setInput] = useState("");
    const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
    const forceSave = useEditorStore((s) => s.forceSave);
    const activeProjectId = useEditorStore((s) => s.activeProjectId);
    const selectedPromptNode = promptNodes.find((n) => n.id === selectedPromptNodeId);
    const updateNodeVariable = useNodesStore((s) => s.updateNodeVariable);
    const handlePlay = useHandlePlay();

    // session-based api
    const activeSessionId = useChatViewStore((s) => s.activeSessionId);
    const setActiveSession = useChatViewStore((s) => s.setActiveSession);
    const appendUser = useChatViewStore((s) => s.appendUser);

    // File attachment functions
    const handleAttachFiles = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = true;
        input.accept = '*/*';

        input.onchange = async (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (!files || !activeSessionId || !activeProjectId) return;

            const fileManagerApi = createFileManagerApi(activeProjectId);
            const sessionFolderPath = `chat/${activeSessionId}`;

            for (const file of Array.from(files)) {
                try {
                    const uploadResponse = await fileManagerApi.uploadFile(file, sessionFolderPath, false);

                    // Determine file type based on MIME type
                    let fileType: AttachedFile['type'] = 'file';
                    if (file.type.startsWith('image/')) fileType = 'image';
                    else if (file.type.startsWith('audio/')) fileType = 'audio';
                    else if (file.type.startsWith('video/')) fileType = 'video';

                    const attachedFile: AttachedFile = {
                        path: uploadResponse.file_path,
                        name: file.name,
                        type: fileType,
                        size: file.size
                    };

                    setAttachedFiles(prev => [...prev, attachedFile]);
                } catch (error) {
                    console.error('Failed to upload file:', error);
                }
            }
        };

        input.click();
    };

    const removeAttachedFile = (index: number) => {
        setAttachedFiles(files => files.filter((_, i) => i !== index));
    };

    const getFileIcon = (type: AttachedFile['type']) => {
        switch (type) {
            case 'image': return '🖼️';
            case 'audio': return '🎵';
            case 'video': return '🎬';
            default: return '📎';
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !selectedPromptNodeId) return;

        setInput("");
        setAttachedFiles([]);

        // 1) Zorg dat er een sessionId is (fallback op nodeId)
        const sessionId = activeSessionId ?? selectedPromptNodeId;
        if (!activeSessionId) setActiveSession(sessionId);

        // 2) Toon prompt meteen in de chat (session-based) - show original input without file paths
        appendUser(sessionId, input);

        try {
            // 3) Schrijf prompt en files naar node + save
            updateNodeVariable(selectedPromptNodeId, "prompt", input);

            // Update files variable if we have attached files
            if (attachedFiles.length > 0) {
                const filePaths = attachedFiles.map(file => file.path);
                updateNodeVariable(selectedPromptNodeId, "files", filePaths);
            } else {
                // Clear files if no attachments
                updateNodeVariable(selectedPromptNodeId, "files", []);
            }

            if (forceSave) await forceSave();

            // 4) Start de run (WS listener voegt agent-chunks toe aan de actieve sessie)
            console.log('[PromptField] Starting play for node:', selectedPromptNodeId, 'stage: mock');
            const syntheticEvent = {
                preventDefault() {},
                stopPropagation() {},
            } as React.MouseEvent;
            await handlePlay(syntheticEvent, selectedPromptNodeId, "mock");
            console.log('[PromptField] Play started successfully');

            window.dispatchEvent(new CustomEvent("restart-log-polling"));
        } catch (e) {
            console.error("send failed", e);
            // evt. rollback toevoegen als je wilt
        }
    };

    return (
        <div className="border-t border-sky-500/50 dark:border-white/10 p-4">
            <div className="max-w-3xl mx-auto">
                {/* Attached Files Display */}
                {attachedFiles.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-2">
                        {attachedFiles.map((file, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 px-3 py-1.5 bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 rounded-full text-sm"
                                title={`Path: ${file.path}\nSize: ${file.size ? Math.round(file.size / 1024) + ' KB' : 'Unknown'}`}
                            >
                                <span>{getFileIcon(file.type)}</span>
                                <span className="truncate max-w-[150px]">{file.name}</span>
                                <button
                                    onClick={() => removeAttachedFile(index)}
                                    className="text-sky-500 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-200"
                                >
                                    <XMarkIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Input Container with Buttons */}
                <div className="relative">
                    <textarea
                        className="w-full resize-none border border-sky-500/50 dark:border-white/20 rounded-md p-3 pr-20 min-h-[40px] max-h-[120px] text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:border-sky-500 dark:focus:border-white/40 transition-colors"
                        rows={1}
                        value={input}
                        placeholder={`Prompt${selectedPromptNode ? ` for ${selectedPromptNode.name}` : ""}...`}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    {/* Attachment Button */}
                    <button
                        className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1.5 transition-colors"
                        onClick={handleAttachFiles}
                        title="Attach files"
                    >
                        <PaperClipIcon className="h-4 w-4"/>
                    </button>

                    {/* Send Button */}
                    <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-white p-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        onClick={handleSend}
                        disabled={!selectedPromptNodeId}
                        title="Send prompt and run workflow"
                    >
                        <ArrowUpIcon className="h-4 w-4"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PromptField;