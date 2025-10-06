'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MyChatWindow } from '@/types/types';
import { fetchMyChatWindowsAPI } from '@/api/chatWindowsApi';
import { Button } from '@/components/button';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { EditorLayout } from '@/components/editor/editor-layout';

export default function ChatWindowPage() {
    const router = useRouter();
    const { chatWindowId } = useParams() as { chatWindowId: string };
    const [chatWindow, setChatWindow] = useState<MyChatWindow | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyChatWindowsAPI()
            .then((data) => {
                const found = data.find((cw) => cw.chat_window.id === chatWindowId);
                if (found) {
                    setChatWindow(found);
                } else {
                    router.push('/chat');
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch chat windows:', err);
                router.push('/chat');
            });
    }, [chatWindowId, router]);

    if (loading || !chatWindow) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="relative h-screen">
            {/* Back to grid button */}
            <div className="absolute top-4 left-4 z-50">
                <Button
                    onClick={() => router.push('/chat')}
                    color="sky"
                    className="shadow-lg"
                >
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Back to Chat Windows
                </Button>
            </div>

            {/* Editor with conditional permissions */}
            <EditorLayout
                projectUuid={chatWindow.project.id}
                chatWindowUuid={chatWindowId}
                chatWindowPermissions={chatWindow.permissions}
            />
        </div>
    );
}
