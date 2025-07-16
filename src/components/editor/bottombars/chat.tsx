'use client';

import React, { useState } from "react";
import { ArrowUpIcon } from '@heroicons/react/24/outline';

const Chat: React.FC = () => {
    const [messages, setMessages] = useState([
        { sender: "user", text: "Hey agent, wat weet je van Dion Snoeijen?" },
        { sender: "agent", text: "Dion Snoeijen is een Nederlandse ondernemer en techneut, bekend van PolySynergy." }
    ]);
    const [input, setInput] = useState("");

    const handleSend = () => {
        if (!input.trim()) return;
        setMessages([...messages, { sender: "user", text: input }]);
        setInput("");
        // Hier zou je je agent aanroepen
    };

    return (
        <div className="flex h-full">
            <div className="flex-1 border-r dark:border-white/10 h-full flex flex-col">
                <div className="border-b border-sky-500/50 dark:border-white/10 p-2">
                    <h3 className="text-sky-500 dark:text-white font-bold text-sm">Logs</h3>
                </div>
                {messages.map((msg, i) => (
                    <div
                        key={i}
                        className={
                            msg.sender === "user"
                                ? "flex justify-end"
                                : "w-full"
                        }
                    >
                        <div
                            className={`px-4 py-2 rounded-xl text-sm max-w-[70%] whitespace-pre-wrap ${
                                msg.sender === "user"
                                    ? "bg-blue-500 text-white"
                                    : "bg-white dark:bg-neutral-800 text-gray-900 dark:text-gray-100 w-full"
                            }`}
                        >
                            {msg.text}
                        </div>
                    </div>
                ))}
            </div>
            <div className="border-t border-gray-200 dark:border-white/10 p-4 flex gap-2 items-end">
                <textarea
                    className="flex-1 resize-none border rounded-lg p-2 min-h-[40px] max-h-[120px] text-sm dark:bg-neutral-900 dark:text-white"
                    rows={1}
                    value={input}
                    placeholder="Stel een vraag aan de agent..."
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
    );
};

export default Chat;