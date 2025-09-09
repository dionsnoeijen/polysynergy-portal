'use client';

import React, {useEffect, useMemo, useRef, useState} from 'react';
import {ArrowUpIcon, Cog6ToothIcon, PlusIcon, ArrowPathIcon} from '@heroicons/react/24/outline';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ReferenceDisplay from './reference-display';
import {parseMessageReferences} from '@/utils/referenceParser';
import useChatStore from '@/stores/chatStore';
import useNodesStore from '@/stores/nodesStore';
import useEditorStore from '@/stores/editorStore';
import {usePromptNodeDetection} from '@/hooks/editor/usePromptNodeDetection';
import {useHandlePlay} from '@/hooks/editor/useHandlePlay';
import {createAgnoChatHistoryApi, ChatHistory, ChatSession} from '@/api/agnoChatHistoryApi';
import {traceStorageConfiguration, traceAgentAndStorage, getSessionInfo} from '@/utils/chatHistoryUtils';

type Msg = {
    id: string;
    sender: 'user' | 'agent';
    text: string;
    timestamp: string | number;
};

const collapseContiguous = (msgs: Msg[]): Msg[] => {
    const out: Msg[] = [];
    for (const m of msgs) {
        if (!m.text?.trim()) continue;
        const last = out[out.length - 1];
        if (last && last.sender === m.sender) {
            last.text += m.text; // concat stream chunk of same sender
            last.timestamp = m.timestamp;
        } else {
            out.push({...m});
        }
    }
    return out;
};

const EnhancedChat: React.FC = () => {
    const {promptNodes, chatWindowVisible, multipleChats} = usePromptNodeDetection();
    const messagesByRun = useChatStore((s) => s.messagesByRun);
    const onRunCompleted = useChatStore((s) => s.onRunCompleted);
    const setPendingUserMessage = useChatStore((s) => s.setPendingUserMessage);
    const activeRunId = useChatStore((s) => s.activeRunId);

    const updateNodeVariable = useNodesStore((s) => s.updateNodeVariable);
    const forceSave = useEditorStore((s) => s.forceSave);
    const activeProjectId = useEditorStore((s) => s.activeProjectId);
    const handlePlay = useHandlePlay();

    const [input, setInput] = useState('');
    const [selectedPromptNodeId, setSelectedPromptNodeId] = useState<string>('');
    const [chatHistory, setChatHistory] = useState<ChatHistory | null>(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [availableSessions, setAvailableSessions] = useState<ChatSession[]>([]);
    const [showSessionSelector, setShowSessionSelector] = useState(false);
    const [agentInfo, setAgentInfo] = useState<{ avatar?: string; name?: string } | null>(null);
    const [manualRefreshLoading, setManualRefreshLoading] = useState(false);
    const [forceReloadTrigger, setForceReloadTrigger] = useState(0);

    // Enkelvoudige waarheden:
    const [baseMessages, setBaseMessages] = useState<Msg[]>([]);      // history óf lokaal
    const [streamMessages, setStreamMessages] = useState<Msg[]>([]);  // alleen huidige run

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    // Selectie prompt node
    useEffect(() => {
        if (promptNodes.length > 0) {
            const exists = promptNodes.some(n => n.id === selectedPromptNodeId);
            if (!selectedPromptNodeId || !exists) setSelectedPromptNodeId(promptNodes[0].id);
        } else {
            setSelectedPromptNodeId('');
        }
    }, [promptNodes, selectedPromptNodeId]);

    // Agent info
    useEffect(() => {
        if (!selectedPromptNodeId) {
            setAgentInfo(null);
            return;
        }
        const res = traceAgentAndStorage(selectedPromptNodeId);
        setAgentInfo(res ? {avatar: res.agentAvatar, name: res.agentName} : null);
    }, [selectedPromptNodeId]);

    const storageConfig = useMemo(() => {
        if (!selectedPromptNodeId) return null;
        return traceStorageConfiguration(selectedPromptNodeId);
    }, [selectedPromptNodeId]);

    const {sessionId, userId} = useMemo(() => {
        if (!selectedPromptNodeId) return {sessionId: null, userId: null as string | null};
        return getSessionInfo(selectedPromptNodeId);
    }, [selectedPromptNodeId]);

    // 1) resolve agent node id zoals je al deed
    const traced = traceAgentAndStorage(selectedPromptNodeId);
    const agentNodeId = traced?.agentNode?.id ?? null;

    // — live session id rechtstreeks uit de Nodes store —
    const sessionIdFromStore = useNodesStore(
        React.useCallback((s) => {
            if (!agentNodeId) return null;
            const n = s.getNode(agentNodeId);
            const v = n?.variables?.find((vv: any) => vv.handle === 'session_id')?.value;
            return (typeof v === 'string' && v.trim() !== '') ? v : null;
        }, [agentNodeId])
    );

    const hasMemory = !!(storageConfig && (sessionIdFromStore ?? sessionId));

    useEffect(() => {
        const load = async () => {
            const {storageNow, sid, uid} = getLiveContext();
            const hasMemoryNow = !!(activeProjectId && storageNow && sid);

            if (!hasMemoryNow) {
                setChatHistory(null);
                setBaseMessages([]);
                setStreamMessages([]);
                return;
            }

            setIsLoadingHistory(true);
            try {
                const chatApi = createAgnoChatHistoryApi(activeProjectId!);
                const history = await chatApi.getSessionHistory(storageNow!, sid!, uid || undefined);
                const uniq = collapseContiguous(
                    (history?.messages || [])
                        .filter(m => m.text?.trim())
                        .map((m, i) => ({
                            id: `${m.timestamp}-${i}`,
                            sender: m.sender,
                            text: m.text,
                            timestamp: m.timestamp
                        }))
                );
                setChatHistory(history || null);
                setBaseMessages(uniq);
                setStreamMessages([]);
            } catch (e) {
                console.error('load history failed', e);
                setChatHistory(null);
                setBaseMessages([]);
                setStreamMessages([]);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        load();
    // ⬇️ voeg sessionIdFromStore toe
    }, [activeProjectId, selectedPromptNodeId, forceReloadTrigger, sessionIdFromStore]);

    // Sessions dropdown data
    const loadAvailableSessions = async () => {
        if (!activeProjectId || !storageConfig) return;
        try {
            const chatApi = createAgnoChatHistoryApi(activeProjectId);
            const sessions = await chatApi.listSessions(storageConfig);
            setAvailableSessions(sessions);
        } catch (e) {
            console.error('list sessions failed', e);
        }
    };

    const createNewSession = () => {
        if (!selectedPromptNodeId) return;
        const res = traceAgentAndStorage(selectedPromptNodeId);
        if (!res) return;
        updateNodeVariable(res.agentNode.id, 'session_id', `session-${Date.now()}`);
        setShowSessionSelector(false);
        setForceReloadTrigger(v => v + 1);
    };

    const selectSession = (sid: string) => {
        if (!selectedPromptNodeId) return;
        const res = traceAgentAndStorage(selectedPromptNodeId);
        if (!res) return;
        updateNodeVariable(res.agentNode.id, 'session_id', sid);
        setShowSessionSelector(false);
        setForceReloadTrigger(v => v + 1);
    };

    const refreshChatHistory = async () => {
        if (!hasMemory) return;
        setManualRefreshLoading(true);
        setForceReloadTrigger(v => v + 1);
        setTimeout(() => setManualRefreshLoading(false), 400);
    };

    // Hash is optioneel; simpele key-compositie werkt vaak al prima.
    const makeKey = (m: { sender: 'user' | 'agent'; timestamp: any; text: string }) =>
        `${m.sender}|${String(m.timestamp)}|${m.text}`;

    const reconcileMessages = (
        prev: Msg[],          // huidige baseMessages
        nextRaw: Msg[]        // messages van server (al collapsed)
    ): Msg[] => {
        const oldByKey = new Map(prev.map(m => [makeKey(m), m.id]));

        const next: Msg[] = nextRaw.map((m, i) => {
            const key = makeKey(m);
            const reusedId = oldByKey.get(key);
            return reusedId ? {...m, id: reusedId} : {...m, id: m.id || `srv-${m.timestamp}-${i}`};
        });

        // (optioneel) als server iets heeft gecorrigeerd qua text/timestamp,
        // krijgt het dus een nieuwe id -> alleen dat item rerendert.
        return next;
    };

    const preserveBottomScroll = (container: HTMLDivElement | null, fn: () => void) => {
        if (!container) {
            fn();
            return;
        }
        const stickToBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 4;
        const bottomOffset = container.scrollHeight - container.scrollTop;

        fn(); // setState etc.

        requestAnimationFrame(() => {
            if (stickToBottom) {
                container.scrollTop = container.scrollHeight; // blijf ‘aan de bodem’
            } else {
                container.scrollTop = container.scrollHeight - bottomOffset; // behoud relatieve positie
            }
        });
    };

    // STREAMING: bouw streamMessages live uit chatStore
    useEffect(() => {
        if (!activeRunId) {
            setStreamMessages([]);
            return;
        }

        const chunks = messagesByRun[activeRunId] || [];
        let seq = 0;
        const mapped: Msg[] = chunks
            .filter((m: any) => m?.text?.trim())
            .map((m: any) => ({
                id: `${activeRunId}-live-${m.sender}-${seq++}`, // unieke id per chunk
                sender: m.sender,
                text: m.text,
                timestamp: m.timestamp || Date.now(),
            }));

        setStreamMessages(collapseContiguous(mapped));
    }, [activeRunId, messagesByRun]);

    useEffect(() => {
        if (!activeRunId) return;
        const unsub = onRunCompleted(activeRunId, async () => {
            setPendingUserMessage(null);
            const container = messagesContainerRef.current;

            const {storageNow, sid, uid} = getLiveContext();

            if (activeProjectId && storageNow && sid) {
                try {
                    const chatApi = createAgnoChatHistoryApi(activeProjectId);
                    const history = await chatApi.getSessionHistory(storageNow, sid, uid || undefined);
                    const uniq = collapseContiguous(
                        (history?.messages || [])
                            .filter(m => m.text?.trim())
                            .map((m, i) => ({
                                id: `${m.timestamp}-${i}`,
                                sender: m.sender,
                                text: m.text,
                                timestamp: m.timestamp
                            }))
                    );
                    setChatHistory(history || null);
                    preserveBottomScroll(container, () => {
                        setBaseMessages(prev => reconcileMessages(prev, uniq));
                        setStreamMessages([]);
                    });
                } catch (e) {
                    console.error('post-complete reload failed', e);
                    preserveBottomScroll(container, () => setStreamMessages([]));
                }
            } else {
                preserveBottomScroll(container, () => {
                    setBaseMessages(prev => collapseContiguous([...prev, ...streamMessages]));
                    setStreamMessages([]);
                });
            }
        });

        // ⬇️ sessionIdFromStore toevoegen
        return unsub;
    }, [activeRunId, selectedPromptNodeId, activeProjectId, onRunCompleted, streamMessages, sessionIdFromStore]);

    // helper om telkens de meest actuele ids/config te pakken
    const getLiveContext = () => {
        const storageNow = selectedPromptNodeId ? traceStorageConfiguration(selectedPromptNodeId) : null;
        const {sessionId: sidMemo, userId: uidMemo} =
            selectedPromptNodeId ? getSessionInfo(selectedPromptNodeId) : {sessionId: null, userId: null};
        return {
            storageNow,
            sid: sessionIdFromStore ?? sidMemo,
            uid: uidMemo,
        };
    };

    // 3) wanneer session_id verandert: zachte reset + herladen
    useEffect(() => {
        if (agentNodeId === null) return;
        // zachte reset
        setChatHistory(null);
        setBaseMessages([]);
        setStreamMessages([]);
        // laat je bestaande loader het opnieuw ophalen (die gebruikt forceReloadTrigger)
        setForceReloadTrigger(x => x + 1);
    }, [agentNodeId, sessionIdFromStore]);

    // Bij run-completion:
    useEffect(() => {
        if (!activeRunId) return;
        const unsub = onRunCompleted(activeRunId, async () => {
            setPendingUserMessage(null);

            const container = messagesContainerRef.current;

            if (hasMemory && activeProjectId && sessionId) {
                try {
                    const chatApi = createAgnoChatHistoryApi(activeProjectId);
                    const history = await chatApi.getSessionHistory(storageConfig!, sessionId, userId || undefined);

                    const uniq = collapseContiguous(
                        (history?.messages || [])
                            .filter(m => m.text?.trim())
                            .map((m, i) => ({
                                id: `${m.timestamp}-${i}`, // tijdelijke id, wordt bij reconcile vervangen als mogelijk
                                sender: m.sender,
                                text: m.text,
                                timestamp: m.timestamp
                            }))
                    );

                    setChatHistory(history || null);

                    preserveBottomScroll(container, () => {
                        setBaseMessages(prev => reconcileMessages(prev, uniq));
                        setStreamMessages([]); // klaar met stream
                    });
                } catch (e) {
                    console.error('post-complete reload failed', e);
                    preserveBottomScroll(container, () => setStreamMessages([]));
                }
            } else {
                // zonder memory: vouw stream in base, maar ook hier: minder jank
                preserveBottomScroll(container, () => {
                    setBaseMessages(prev => collapseContiguous([...prev, ...streamMessages]));
                    setStreamMessages([]);
                });
            }
        });
        return unsub;
    }, [activeRunId, hasMemory, activeProjectId, sessionId, storageConfig, userId, onRunCompleted, streamMessages]);

    // Scroll altijd naar onder bij verandering
    const rendered = useMemo(() => {
        const all = [...baseMessages, ...streamMessages];
        return all.map((msg, i) => (
            <div key={msg.id || i}
                 className={msg.sender === 'user' ? 'flex justify-end' : 'flex justify-start items-start space-x-2'}>
                {msg.sender === 'agent' && agentInfo?.avatar && (
                    <div className="flex-shrink-0 mt-1">
                        <img
                            src={agentInfo.avatar}
                            alt={agentInfo.name || 'Agent'}
                            className="w-8 h-8 rounded-full object-cover"
                            onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = 'none';
                            }}
                        />
                    </div>
                )}
                <div
                    className={`px-4 py-2 rounded-xl text-sm max-w-[70%] ${msg.sender === 'user' ? 'bg-blue-500 text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                    {msg.sender === 'user' ? (
                        <div className="whitespace-pre-wrap">{msg.text}</div>
                    ) : (
                        (() => {
                            const parsed = parseMessageReferences(msg.text);
                            return (
                                <div>
                                    {parsed.references?.length > 0 &&
                                        <ReferenceDisplay references={parsed.references}/>}
                                    {parsed.text && (
                                        <div className="prose prose-sm dark:prose-invert max-w-none">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                                    code: ({children, className}) => {
                                                        const inline = !className;
                                                        return inline ? (
                                                            <code
                                                                className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-xs">{children}</code>
                                                        ) : (
                                                            <code
                                                                className="block bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs overflow-x-auto">{children}</code>
                                                        );
                                                    },
                                                    pre: ({children}) => <pre
                                                        className="bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-x-auto">{children}</pre>,
                                                    ul: ({children}) => <ul
                                                        className="list-disc list-inside mb-2">{children}</ul>,
                                                    ol: ({children}) => <ol
                                                        className="list-decimal list-inside mb-2">{children}</ol>,
                                                    li: ({children}) => <li className="mb-1">{children}</li>,
                                                    blockquote: ({children}) => <blockquote
                                                        className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 italic">{children}</blockquote>,
                                                }}
                                            >
                                                {parsed.text}
                                            </ReactMarkdown>
                                        </div>
                                    )}
                                </div>
                            );
                        })()
                    )}
                </div>
            </div>
        ));
    }, [baseMessages, streamMessages, agentInfo]);

    useEffect(() => {
        const el = messagesEndRef.current;
        if (!el) return;
        requestAnimationFrame(() => el.scrollIntoView({behavior: 'smooth'}));
    }, [baseMessages.length, streamMessages.length, streamMessages.at(-1)?.text]);

    const handleSend = async () => {
        if (!input.trim() || !selectedPromptNodeId) return;
        const userInput = input;
        setInput('');
        setPendingUserMessage(userInput);

        // **Belangrijk**: push de user prompt direct in stream (zodat altijd onderaan)
        setStreamMessages((prev) => [
            ...prev,
            {id: `local-user-${Date.now()}`, sender: 'user', text: userInput, timestamp: Date.now()}
        ]);

        try {
            updateNodeVariable(selectedPromptNodeId, 'prompt', userInput);
            if (forceSave) await forceSave();

            const syntheticEvent = {
                preventDefault() {
                }, stopPropagation() {
                }
            } as React.MouseEvent;
            await handlePlay(syntheticEvent, selectedPromptNodeId, 'mock');

            // Trigger log polling opnieuw (zoals je had)
            window.dispatchEvent(new CustomEvent('restart-log-polling'));
        } catch (e) {
            console.error('send failed', e);
            setPendingUserMessage(null);
            // rollback user prompt uit stream
            setStreamMessages((prev) => prev.filter(m => !m.id.startsWith('local-user-')));
        }
    };

    const selectedPromptNode = promptNodes.find(n => n.id === selectedPromptNodeId);

    if (!chatWindowVisible) {
        return (
            <div className="flex items-center justify-center h-full p-8">
                <div className="text-center text-gray-500 dark:text-gray-400">
                    <div className="text-lg font-medium mb-2">No prompt node found</div>
                    <div className="text-sm">Add a PromptNode to enable chat functionality</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            {multipleChats && (
                <div className="border-b border-gray-200 dark:border-white/10">
                    <div className="flex justify-between items-center">
                        <div className="flex">
                            {promptNodes.map((node) => (
                                <button
                                    key={node.id}
                                    onClick={() => setSelectedPromptNodeId(node.id)}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                                        selectedPromptNodeId === node.id
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                    }`}
                                >
                                    {node.name}
                                </button>
                            ))}
                        </div>
                        {selectedPromptNodeId && (
                            <div className="flex items-center space-x-2 px-4">
                                <button
                                    onClick={refreshChatHistory}
                                    disabled={manualRefreshLoading || !hasMemory}
                                    className={`text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 disabled:opacity-50 ${manualRefreshLoading ? 'animate-spin' : ''}`}
                                    title="Refresh chat history"
                                >
                                    <ArrowPathIcon className="h-4 w-4"/>
                                </button>
                                <button
                                    onClick={createNewSession}
                                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    title="New session"
                                >
                                    <PlusIcon className="h-4 w-4"/>
                                </button>
                                <button
                                    onClick={() => {
                                        loadAvailableSessions();
                                        setShowSessionSelector(!showSessionSelector);
                                    }}
                                    className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    title="Manage sessions"
                                >
                                    <Cog6ToothIcon className="h-4 w-4"/>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showSessionSelector && (
                <div className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-gray-800 p-4">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Select Session</div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        <button
                            onClick={createNewSession}
                            className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-600 dark:text-blue-400"
                        >
                            + Create New Session
                        </button>
                        {availableSessions.map((s) => (
                            <button
                                key={s.session_id}
                                onClick={() => selectSession(s.session_id)}
                                className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                <div className="font-medium">{s.session_name || s.session_id}</div>
                                <div className="text-xs text-gray-500">
                                    {s.message_count} messages • {new Date(s.last_activity).toLocaleDateString()}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div ref={messagesContainerRef} className="flex-1 overflow-auto p-4 space-y-2">
                {isLoadingHistory && (
                    <div className="flex justify-center text-gray-500 dark:text-gray-400 text-sm">Loading chat
                        history...</div>
                )}

                {!hasMemory && !isLoadingHistory && (
                    <div
                        className="text-center text-xs text-orange-500 dark:text-orange-400 pb-2 border-b border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 p-2 rounded">
                        ⚠️ No memory connected — messages won’t persist
                    </div>
                )}

                {chatHistory && !isLoadingHistory && (
                    <div
                        className="text-center text-xs text-gray-400 dark:text-gray-500 pb-2 border-b border-gray-200 dark:border-gray-700">
                        Session: {chatHistory.session_id}
                        {chatHistory.session_info.created_at && <> •
                            Started {new Date(chatHistory.session_info.created_at).toLocaleDateString()}</>}
                        {chatHistory.total_messages > 0 && <> • {chatHistory.total_messages} messages</>}
                    </div>
                )}

                {rendered}
                <div ref={messagesEndRef}/>
            </div>

            <div className="border-t border-sky-500/50 dark:border-white/10 p-4">
                <div className="relative max-w-3xl mx-auto">
                    <textarea
                        className="w-full resize-none border border-sky-500/50 dark:border-white/20 rounded-md p-3 pr-12 min-h-[40px] max-h-[120px] text-sm bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:border-sky-500 dark:focus:border-white/40 transition-colors"
                        rows={1}
                        value={input}
                        placeholder={`Prompt${selectedPromptNode ? ` for ${selectedPromptNode.name}` : ''}...`}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <button
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-white p-1.5 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default EnhancedChat;