'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MyChatWindow } from '@/types/types';
import { fetchMyChatWindowsAPI } from '@/api/chatWindowsApi';
import { Heading } from '@/components/heading';
import { Text } from '@/components/text';
import { Badge } from '@/components/badge';

export default function ChatWindowsPage() {
    const router = useRouter();
    const [chatWindows, setChatWindows] = useState<MyChatWindow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchMyChatWindowsAPI()
            .then((data) => {
                setChatWindows(data);
                setLoading(false);
            })
            .catch((err) => {
                console.error('Failed to fetch chat windows:', err);
                setError('Failed to load chat windows');
                setLoading(false);
            });
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Text>Loading your chat windows...</Text>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Heading>Error</Heading>
                    <Text className="text-red-500">{error}</Text>
                </div>
            </div>
        );
    }

    if (chatWindows.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Heading>No Chat Windows Assigned</Heading>
                    <Text className="mt-4 text-zinc-500 dark:text-zinc-400">
                        You don't have access to any chat windows yet.
                        <br />
                        Contact your administrator to get access.
                    </Text>
                </div>
            </div>
        );
    }

    const isAdmin = (permissions: MyChatWindow['permissions']) => {
        return permissions.can_edit_flow;
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-900 p-8">
            <div className="max-w-7xl mx-auto">
                <Heading className="mb-8">Your Chat Windows</Heading>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {chatWindows.map((item) => (
                        <div
                            key={item.chat_window.id}
                            onClick={() => router.push(`/chat/${item.chat_window.id}`)}
                            className="
                                bg-white dark:bg-zinc-800
                                border border-zinc-200 dark:border-zinc-700
                                rounded-lg p-6
                                cursor-pointer
                                hover:border-sky-500 dark:hover:border-sky-400
                                hover:shadow-lg
                                transition-all duration-200
                                group
                            "
                        >
                            <div className="flex items-start justify-between mb-3">
                                <Heading level={3} className="text-lg font-semibold group-hover:text-sky-600 dark:group-hover:text-sky-400">
                                    {item.chat_window.name}
                                </Heading>
                                {isAdmin(item.permissions) && (
                                    <Badge color="blue">Admin</Badge>
                                )}
                            </div>

                            {item.chat_window.description && (
                                <Text className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                                    {item.chat_window.description}
                                </Text>
                            )}

                            <div className="space-y-1 text-xs text-zinc-500 dark:text-zinc-500">
                                <div>
                                    <span className="font-medium">Project:</span> {item.project.name}
                                </div>
                                <div>
                                    <span className="font-medium">Tenant:</span> {item.tenant.name}
                                </div>
                            </div>

                            <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700">
                                <div className="flex flex-wrap gap-1">
                                    {item.permissions.can_view_flow && (
                                        <Badge color="zinc" className="text-xs">View Flow</Badge>
                                    )}
                                    {item.permissions.can_view_output && (
                                        <Badge color="zinc" className="text-xs">View Output</Badge>
                                    )}
                                    {item.permissions.show_response_transparency && (
                                        <Badge color="zinc" className="text-xs">AI Reasoning</Badge>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
