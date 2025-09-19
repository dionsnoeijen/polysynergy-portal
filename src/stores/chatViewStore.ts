// stores/chatViewStore.ts
import {create} from "zustand";
import {ChatHistory, ChatMessage, createAgnoChatHistoryApi, StorageConfig} from "@/api/agnoChatHistoryApi";

export type ChatViewMessage = {
    id: string;
    sender: "user" | "agent";
    text: string;
    timestamp: number;
    node_id?: string | null;
    run_id?: string | null;
    parts?: Array<{ seq?: number; ts: number; text: string }>;
};

export type TeamMember = {
    id: string;
    name: string;
    avatar?: string;
    isActive: boolean;
    lastActivityTime: number;
    memberIndex?: number;
};

type ChatViewState = {
    activeSessionId: string | null;
    messagesBySession: Record<string, ChatViewMessage[]>;
    bubbleMessagesBySession: Record<string, ChatViewMessage[]>;
    activeTeamMembers: Record<string, TeamMember>;

    setActiveSession: (sessionId: string | null) => void;
    getActiveSessionId: () => string | null;

    appendUser: (sessionId: string, text: string) => void;
    appendAgentChunk: (
        sessionId: string,
        nodeId: string | undefined,
        text: string,
        ts?: number,
        seq?: number,
        runId?: string | null
    ) => void;
    
    appendAgentChunkBubbleOnly: (
        sessionId: string,
        nodeId: string | undefined,
        text: string,
        ts?: number,
        seq?: number,
        runId?: string | null
    ) => void;

    finalizeAgentMessage: (sessionId: string) => void;
    replaceHistory: (sessionId: string, messages: ChatViewMessage[]) => void;
    getMessages: () => ChatViewMessage[];
    syncSessionFromBackend: (args: {
        projectId: string;
        storageConfig: StorageConfig;
        sessionId: string;
        userId?: string;
        limit?: number;
    }) => Promise<void>;
    
    // Clear functions to replace chatStore functionality
    clearSession: (sessionId?: string) => void;
    clearAllSessions: () => void;
    clearBubbles: () => void;
    
    // Team member activity tracking
    setTeamMemberActive: (memberId: string, memberName: string, memberIndex?: number) => void;
    setTeamMemberInactive: (memberId: string) => void;
    clearTeamMembers: () => void;
};

const MERGE_WINDOW_MS = 5000; // iets ruimer voor streaming

const useChatViewStore = create<ChatViewState>((set, get) => ({
    activeSessionId: null,
    messagesBySession: {},
    bubbleMessagesBySession: {},
    activeTeamMembers: {},

    setActiveSession: (sessionId) => set({activeSessionId: sessionId}),
    getActiveSessionId: () => get().activeSessionId,

    appendUser: (sessionId, text) =>
        set((s) => {
            const now = Date.now();
            const prev = s.messagesBySession[sessionId] ?? [];
            const last = prev[prev.length - 1];

            if (last && last.sender === "user" && now - last.timestamp <= MERGE_WINDOW_MS) {
                const merged = [...prev];
                merged[merged.length - 1] = {...last, text: last.text + text, timestamp: now};
                return {messagesBySession: {...s.messagesBySession, [sessionId]: merged}};
            }

            const next: ChatViewMessage = {
                id: `user-${now}`,
                sender: "user",
                text,
                timestamp: now,
            };
            return {messagesBySession: {...s.messagesBySession, [sessionId]: [...prev, next]}};
        }),

    appendAgentChunk: (sessionId, nodeId, text, ts, seq, runId) =>
        set((s) => {
            const now = ts ?? Date.now(); // verwacht ms
            const prev = s.messagesBySession[sessionId] ?? [];
            const last = prev[prev.length - 1];

            const sameAgentThread =
                last?.sender === "agent" &&
                (last.node_id ?? null) === (nodeId ?? null) &&
                (last.run_id ?? null) === (runId ?? null);

            const withinWindow = last ? now - last.timestamp <= MERGE_WINDOW_MS : false;

            if (sameAgentThread && withinWindow) {
                // voeg als part toe, sorteer, rebuild text
                const merged = [...prev];
                const msg = {...last};
                const parts = msg.parts ? [...msg.parts] : [];
                parts.push({seq, ts: now, text});
                parts.sort((a, b) => {
                    if (a.seq != null && b.seq != null && a.seq !== b.seq) return a.seq - b.seq;
                    return a.ts - b.ts; // fallback
                });
                msg.parts = parts;
                msg.text = parts.map((p) => p.text).join(""); // of "\n" als je paragraph breaks wilt
                msg.timestamp = now;
                merged[merged.length - 1] = msg;
                
                // Update bubbles store with same logic
                const bubblePrev = s.bubbleMessagesBySession[sessionId] ?? [];
                const bubbleLast = bubblePrev[bubblePrev.length - 1];
                const bubbleMerged = [...bubblePrev];
                if (bubbleLast && bubbleLast.sender === "agent" && 
                    (bubbleLast.node_id ?? null) === (nodeId ?? null) &&
                    (bubbleLast.run_id ?? null) === (runId ?? null)) {
                    const bubbleMsg = {...bubbleLast};
                    const bubbleParts = bubbleMsg.parts ? [...bubbleMsg.parts] : [];
                    bubbleParts.push({seq, ts: now, text});
                    bubbleParts.sort((a, b) => {
                        if (a.seq != null && b.seq != null && a.seq !== b.seq) return a.seq - b.seq;
                        return a.ts - b.ts;
                    });
                    bubbleMsg.parts = bubbleParts;
                    bubbleMsg.text = bubbleParts.map((p) => p.text).join("");
                    bubbleMsg.timestamp = now;
                    bubbleMerged[bubbleMerged.length - 1] = bubbleMsg;
                }
                
                return {
                    messagesBySession: {...s.messagesBySession, [sessionId]: merged},
                    bubbleMessagesBySession: {...s.bubbleMessagesBySession, [sessionId]: bubbleMerged}
                };
            }

            const next: ChatViewMessage = {
                id: `agent-${now}-${Math.random().toString(36).slice(2, 7)}`,
                sender: "agent",
                text,
                timestamp: now,
                node_id: nodeId ?? null,
                run_id: runId ?? null,
                parts: [{seq, ts: now, text}],
            };
            
            // Also add to bubbles store
            const bubblePrev = s.bubbleMessagesBySession[sessionId] ?? [];
            
            return {
                messagesBySession: {
                    ...s.messagesBySession,
                    [sessionId]: [...prev, next],
                },
                bubbleMessagesBySession: {
                    ...s.bubbleMessagesBySession,
                    [sessionId]: [...bubblePrev, next],
                },
            };
        }),

    appendAgentChunkBubbleOnly: (sessionId, nodeId, text, ts, seq, runId) =>
        set((s) => {
            const now = ts ?? Date.now();
            const bubblePrev = s.bubbleMessagesBySession[sessionId] ?? [];
            const bubbleLast = bubblePrev[bubblePrev.length - 1];

            const sameAgentThread =
                bubbleLast?.sender === "agent" &&
                (bubbleLast.node_id ?? null) === (nodeId ?? null) &&
                (bubbleLast.run_id ?? null) === (runId ?? null);

            const withinWindow = bubbleLast ? now - bubbleLast.timestamp <= MERGE_WINDOW_MS : false;

            if (sameAgentThread && withinWindow) {
                // Merge with existing bubble message
                const bubbleMerged = [...bubblePrev];
                const bubbleMsg = {...bubbleLast};
                const bubbleParts = bubbleMsg.parts ? [...bubbleMsg.parts] : [];
                bubbleParts.push({seq, ts: now, text});
                bubbleParts.sort((a, b) => {
                    if (a.seq != null && b.seq != null && a.seq !== b.seq) return a.seq - b.seq;
                    return a.ts - b.ts;
                });
                bubbleMsg.parts = bubbleParts;
                bubbleMsg.text = bubbleParts.map((p) => p.text).join("");
                bubbleMsg.timestamp = now;
                bubbleMerged[bubbleMerged.length - 1] = bubbleMsg;
                
                return {
                    bubbleMessagesBySession: {...s.bubbleMessagesBySession, [sessionId]: bubbleMerged}
                };
            }

            // Create new bubble message
            const next: ChatViewMessage = {
                id: `agent-bubble-${now}-${Math.random().toString(36).slice(2, 7)}`,
                sender: "agent",
                text,
                timestamp: now,
                node_id: nodeId ?? null,
                run_id: runId ?? null,
                parts: [{seq, ts: now, text}],
            };
            
            return {
                bubbleMessagesBySession: {
                    ...s.bubbleMessagesBySession,
                    [sessionId]: [...bubblePrev, next],
                },
            };
        }),

    finalizeAgentMessage: () => ({}),

    replaceHistory: (sessionId, messages) =>
        set((s) => ({
            messagesBySession: {...s.messagesBySession, [sessionId]: messages}
            // Don't update bubbleMessagesBySession - bubbles only show live streaming content
        })),

    getMessages: () => {
        const {activeSessionId, messagesBySession} = get();
        if (!activeSessionId) return [];
        return messagesBySession[activeSessionId] ?? [];
    },

    syncSessionFromBackend: async ({projectId, storageConfig, sessionId, userId, limit = 200}) => {
        try {
            const api = createAgnoChatHistoryApi(projectId);
            const data: ChatHistory = await api.getSessionHistory(storageConfig, sessionId, userId, limit);
            
            console.log("[chat-sync] Received chat history data:", data);

            // Als backend niks terug geeft (geen storage of empty), niet forceren
            if (!data || !Array.isArray(data.messages)) return;

            // Map naar ChatViewMessage (timestamps naar ms, id stabiel genoeg)
            const mapped: ChatViewMessage[] = data.messages.map((m: ChatMessage, i) => {
                const tsMs =
                    typeof m.timestamp === "string"
                        ? new Date(m.timestamp).getTime()
                        : (m.timestamp as unknown as number);
                
                // Debug S3 URLs in message text
                if (m.text && m.text.includes('s3.amazonaws.com')) {
                    console.log(`[S3-Debug] Message ${i} contains S3 URLs:`, m.text.substring(0, 200));
                    
                    // Look for presigned URL signatures to see if refresh is working
                    const hasPresignedParams = m.text.includes('X-Amz-Signature') || m.text.includes('X-Amz-Algorithm');
                    console.log(`[S3-Debug] Message ${i} has presigned parameters:`, hasPresignedParams);
                    
                    // Extract and log actual URLs
                    const s3UrlMatch = m.text.match(/https:\/\/[^\/]+\.s3\.amazonaws\.com\/[^\s\)]+/g);
                    if (s3UrlMatch) {
                        console.log(`[S3-Debug] Extracted URLs from message ${i}:`, s3UrlMatch);
                    }
                }
                
                return {
                    id: `srv-${data.session_id}-${i}-${tsMs || Date.now()}`,
                    sender: m.sender === "user" ? "user" : "agent",
                    text: m.text ?? "",
                    timestamp: tsMs || Date.now(),
                    node_id: (m as {node_id?: string}).node_id || null,  // Use node_id from backend (team_id/agent_id)
                    run_id: (m as {run_id?: string}).run_id || null,  // Use run_id from backend if available
                };
            });

            get().replaceHistory(sessionId, mapped);
        } catch (e) {
            // Niet fatal voor UI: log en laat lokale state staan
            console.warn("[chat-sync] failed to fetch session history", e);
        }
    },
    
    // Clear functions to replace chatStore functionality
    clearSession: (sessionId) => 
        set((s) => {
            if (!sessionId) {
                // If no sessionId provided, clear active session
                const activeId = s.activeSessionId;
                if (!activeId) return s;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const {[activeId]: _, ...remaining} = s.messagesBySession;
                return {messagesBySession: remaining};
            } else {
                // Clear specific session
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const {[sessionId]: _, ...remaining} = s.messagesBySession;
                return {messagesBySession: remaining};
            }
        }),
    
    clearAllSessions: () => 
        set(() => ({
            activeSessionId: null,
            messagesBySession: {},
            bubbleMessagesBySession: {}
        })),
        
    clearBubbles: () => 
        set(() => ({
            bubbleMessagesBySession: {}
        })),
    
    // Team member activity tracking
    setTeamMemberActive: (memberId, memberName, memberIndex) => 
        set((s) => ({
            activeTeamMembers: {
                ...s.activeTeamMembers,
                [memberId]: {
                    id: memberId,
                    name: memberName,
                    isActive: true,
                    lastActivityTime: Date.now(),
                    memberIndex
                }
            }
        })),
        
    setTeamMemberInactive: (memberId) =>
        set((s) => ({
            activeTeamMembers: {
                ...s.activeTeamMembers,
                [memberId]: {
                    ...s.activeTeamMembers[memberId],
                    isActive: false,
                    lastActivityTime: Date.now()
                }
            }
        })),
        
    clearTeamMembers: () =>
        set(() => ({
            activeTeamMembers: {}
        })),
}));

export default useChatViewStore;