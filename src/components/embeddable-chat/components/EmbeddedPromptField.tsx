import React, { useState, useRef, useEffect } from 'react';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';
import { useEmbeddedChatStore } from '../stores/embeddedChatStore';

interface EmbeddedPromptFieldProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

const EmbeddedPromptField: React.FC<EmbeddedPromptFieldProps> = ({
    onSend,
    disabled = false,
    placeholder = 'Type a message...',
}) => {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isWaitingForResponse = useEmbeddedChatStore((s) => s.isWaitingForResponse);
    const isConnected = useEmbeddedChatStore((s) => s.isConnected);

    const isDisabled = disabled || isWaitingForResponse || !isConnected;

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [input]);

    const handleSubmit = () => {
        if (input.trim() && !isDisabled) {
            onSend(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
            <div className="flex items-end gap-2">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isConnected ? placeholder : 'Connecting...'}
                    disabled={isDisabled}
                    rows={1}
                    className="flex-1 resize-none px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                    onClick={handleSubmit}
                    disabled={isDisabled || !input.trim()}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <PaperAirplaneIcon className="w-5 h-5" />
                </button>
            </div>

            {!isConnected && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                    Connecting to chat server...
                </p>
            )}
        </div>
    );
};

export default EmbeddedPromptField;
