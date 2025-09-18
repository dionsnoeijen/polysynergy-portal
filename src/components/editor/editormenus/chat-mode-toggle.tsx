import React from 'react';
import { ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';
import useEditorStore from '@/stores/editorStore';

const ChatModeToggle: React.FC = () => {
    const chatMode = useEditorStore((state) => state.chatMode);

    const handleToggle = () => {
        if (chatMode) {
            // Exit Chat Mode
            window.dispatchEvent(new CustomEvent('exitChatMode'));
        } else {
            // Enter Chat Mode
            window.dispatchEvent(new CustomEvent('enterChatMode'));
        }
    };

    return (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 z-[50]">
            <button
                onClick={handleToggle}
                title={chatMode ? "Exit Chat Mode (Shift+C)" : "Enter Chat Mode (Shift+C)"}
                className={`p-1.5 rounded text-xs transition-colors ${
                    chatMode 
                        ? 'bg-sky-100 dark:bg-zinc-800 text-sky-600 dark:text-white hover:bg-sky-200 dark:hover:bg-zinc-600 border border-sky-500/60 dark:border-white/25' 
                        : 'bg-sky-500 hover:bg-sky-600 text-white'
                }`}
            >
                {chatMode ? (
                    <ArrowLeftOnRectangleIcon className="w-4 h-4" />
                ) : (
                    <ArrowRightOnRectangleIcon className="w-4 h-4" />
                )}
            </button>
        </div>
    );
};

export default ChatModeToggle;