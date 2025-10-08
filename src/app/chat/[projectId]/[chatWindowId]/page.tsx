'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MyChatWindow } from '@/types/types';
import { fetchMyChatWindowsAPI } from '@/api/chatWindowsApi';
import { EditorLayout } from '@/components/editor/editor-layout';
import useEditorStore from '@/stores/editorStore';

export default function ChatWindowPage() {
    const router = useRouter();
    const { projectId, chatWindowId } = useParams() as { projectId: string; chatWindowId: string };
    const [chatWindow, setChatWindow] = useState<MyChatWindow | null>(null);
    const [loading, setLoading] = useState(true);
    const setChatWindowPermissions = useEditorStore((state) => state.setChatWindowPermissions);

    useEffect(() => {
        fetchMyChatWindowsAPI()
            .then((data) => {
                const found = data.find((cw) => cw.chat_window.id === chatWindowId);
                if (found) {
                    setChatWindow(found);
                    // Store permissions in editorStore for conditional UI
                    setChatWindowPermissions(found.permissions);
                } else {
                    router.push('/chat');
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch chat windows:', err);
                router.push('/chat');
            });
    }, [chatWindowId, router, setChatWindowPermissions]);

    if (loading || !chatWindow) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <EditorLayout
            projectUuid={projectId}
            chatWindowUuid={chatWindowId}
            isEndUserChatMode={true}
            showChatBackButton={true}
            onChatBackClick={() => router.push('/chat')}
        />
    );
}
