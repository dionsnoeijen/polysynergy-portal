import React, { useEffect, useRef } from 'react';
import { useEmbeddedChatStore, ChatMessage } from '../stores/embeddedChatStore';
import MarkdownContent from '@/components/editor/chat/components/markdown-content';

interface EmbeddedMessagesProps {
    onResume?: (runId: string, nodeId: string, response: string) => void;
}

const MessageBubble: React.FC<{
    message: ChatMessage;
    onResume?: (runId: string, nodeId: string, response: string) => void;
}> = ({ message, onResume }) => {
    const [resumeInput, setResumeInput] = React.useState('');

    const isUser = message.sender === 'user';
    const isSystem = message.sender === 'system';
    const isPause = !!message.pause_data;

    const handleResume = () => {
        if (message.pause_data && resumeInput.trim()) {
            onResume?.(
                message.pause_data.run_id,
                message.pause_data.node_id,
                resumeInput.trim()
            );
            setResumeInput('');
        }
    };

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
            <div
                className={`max-w-[80%] px-4 py-2 rounded-lg ${
                    isUser
                        ? 'bg-blue-500 text-white'
                        : isSystem
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border border-yellow-300 dark:border-yellow-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
            >
                {isUser ? (
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                ) : (
                    <div className="text-sm">
                        <MarkdownContent text={message.content} enableMarkdown />
                    </div>
                )}

                {isPause && (
                    <div className="mt-3 space-y-2">
                        <input
                            type="text"
                            value={resumeInput}
                            onChange={(e) => setResumeInput(e.target.value)}
                            placeholder="Type your response..."
                            className="w-full px-3 py-2 text-sm border rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleResume();
                                }
                            }}
                        />
                        <button
                            onClick={handleResume}
                            disabled={!resumeInput.trim()}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Continue
                        </button>
                    </div>
                )}

                <span className="text-xs opacity-60 mt-1 block">
                    {message.timestamp.toLocaleTimeString()}
                </span>
            </div>
        </div>
    );
};

const StreamingBubble: React.FC<{ content: string }> = ({ content }) => {
    if (!content) return null;

    return (
        <div className="flex justify-start mb-3">
            <div className="max-w-[80%] px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                <div className="text-sm">
                    <MarkdownContent text={content} enableMarkdown />
                </div>
                <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
            </div>
        </div>
    );
};

const ThinkingIndicator: React.FC = () => (
    <div className="flex justify-start mb-3">
        <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700">
            <div className="flex space-x-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    </div>
);

const EmbeddedMessages: React.FC<EmbeddedMessagesProps> = ({ onResume }) => {
    const messages = useEmbeddedChatStore((s) => s.messages);
    const currentStreamingMessage = useEmbeddedChatStore((s) => s.currentStreamingMessage);
    const isWaitingForResponse = useEmbeddedChatStore((s) => s.isWaitingForResponse);

    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [messages, currentStreamingMessage, isWaitingForResponse]);

    const hasContent = messages.length > 0 || currentStreamingMessage || isWaitingForResponse;

    return (
        <div
            ref={containerRef}
            className="flex-1 overflow-y-auto p-4"
        >
            {!hasContent && (
                <div className="h-full flex items-center justify-center text-gray-400">
                    <p>Start a conversation...</p>
                </div>
            )}

            {messages.map((message) => (
                <MessageBubble key={message.id} message={message} onResume={onResume} />
            ))}

            {currentStreamingMessage && (
                <StreamingBubble content={currentStreamingMessage} />
            )}

            {isWaitingForResponse && !currentStreamingMessage && (
                <ThinkingIndicator />
            )}
        </div>
    );
};

export default EmbeddedMessages;
