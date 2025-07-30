'use client';

import React, { useEffect, useRef, useState } from "react";
import { ArrowUpIcon } from '@heroicons/react/24/outline';
import useChatStore from '@/stores/chatStore';

const Chat: React.FC = () => {
    const messagesByRun = useChatStore((state) => state.messagesByRun);
    const addUserMessage = useChatStore((state) => state.addUserMessage);

    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Pak laatste runId op basis van meest recente key (gesorteerd op array-lengte of entry-volgorde)
    const sortedRunIds = Object.entries(messagesByRun)
        .sort((a, b) => b[1].length - a[1].length)
        .map(([runId]) => runId);
    const latestRunId = sortedRunIds[0];

    const messages = latestRunId ? messagesByRun[latestRunId] : [];

    const handleSend = () => {
        if (!input.trim()) return;
        if (!latestRunId) return; // geen actieve run, misschien nog niet gestart
        addUserMessage(input, latestRunId);
        setInput("");
    };

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto p-4 space-y-2">
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={msg.sender === "user" ? "flex justify-end" : "flex justify-start"}
                    >
                        <div
                            className={`px-4 py-2 rounded-xl text-sm max-w-[70%] whitespace-pre-wrap ${
                                msg.sender === "user"
                                    ? "bg-blue-500 text-white"
                                    : "bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100"
                            }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-200 dark:border-white/10 p-4">
                <div className="flex gap-2 max-w-3xl mx-auto items-end">
                    <textarea
                        className="flex-1 resize-none border rounded-lg p-2 min-h-[40px] max-h-[120px] text-sm dark:bg-neutral-900 dark:text-white"
                        rows={1}
                        value={input}
                        placeholder="Prompt..."
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <button
                        className="bg-sky-600 hover:bg-sky-700 text-white p-2 rounded-full"
                        onClick={handleSend}
                    >
                        <ArrowUpIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;