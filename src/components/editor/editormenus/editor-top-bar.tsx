'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    GlobeAltIcon,
    ClockIcon,
    ChatBubbleLeftRightIcon,
    CubeIcon,
    XMarkIcon,
    BookOpenIcon,
    ChatBubbleBottomCenterTextIcon
} from '@heroicons/react/24/outline';
import { useUnifiedAuth } from '@/hooks/useUnifiedAuth';
import { sendFeedback } from '@/api/feedbackApi';
import Modal from '@/components/modal';
import { Input } from '@/components/input';
import { Textarea } from '@/components/textarea';
import { Button } from '@/components/button';
import useEditorStore from '@/stores/editorStore';
import useDocumentationStore from '@/stores/documentationStore';
import useEditorTabsStore, { EditorTab } from '@/stores/editorTabsStore';
import TabCreateDropdown from '@/components/editor/editormenus/tab-create-dropdown';
import { useBranding } from '@/contexts/branding-context';
import { hexToRgba } from '@/utils/colorUtils';

type EditorTopBarProps = {
    projectId?: string;
    onTabChange?: (tab: EditorTab) => void;
    onTabClose?: (tab: EditorTab) => void;
};

const EditorTopBar: React.FC<EditorTopBarProps> = ({ projectId, onTabChange, onTabClose }) => {
    const router = useRouter();
    const auth = useUnifiedAuth();
    const tabsContainerRef = useRef<HTMLDivElement>(null);
    const { accent_color } = useBranding();

    // State
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [email, setEmail] = useState(auth.user?.profile.email as string || '');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Documentation
    const openDocs = useEditorStore((state) => state.openDocs);
    const setDocumentationType = useDocumentationStore((state) => state.setDocumentationType);
    const fetchCategories = useDocumentationStore((state) => state.fetchCategories);

    // Tabs
    const getTabsForProject = useEditorTabsStore((state) => state.getTabsForProject);
    const getActiveTab = useEditorTabsStore((state) => state.getActiveTab);
    const setActiveTab = useEditorTabsStore((state) => state.setActiveTab);
    const removeTab = useEditorTabsStore((state) => state.removeTab);

    const tabs = projectId ? getTabsForProject(projectId) : [];
    const activeTab = projectId ? getActiveTab(projectId) : null;

    // Get icon based on type
    const getIcon = (type: string) => {
        switch (type) {
            case 'route':
                return GlobeAltIcon;
            case 'schedule':
                return ClockIcon;
            case 'chatwindow':
                return ChatBubbleLeftRightIcon;
            case 'blueprint':
                return CubeIcon;
            default:
                return GlobeAltIcon;
        }
    };

    // Scroll active tab into view
    useEffect(() => {
        if (activeTab && tabsContainerRef.current) {
            const activeButton = tabsContainerRef.current.querySelector(`[data-tab-id="${activeTab.id}"]`);
            if (activeButton) {
                activeButton.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
            }
        }
    }, [activeTab]);

    // Handle tab click
    const handleTabClick = (tab: EditorTab) => {
        if (!projectId) return;

        // Set loading state
        useEditorStore.getState().setIsLoadingFlow(true);

        // Update active tab
        setActiveTab(projectId, tab.id);

        // Update URL without full navigation (soft navigation)
        const fundamentalPath = tab.type === 'chatwindow' ? 'chat-window' : tab.type;
        router.replace(`/project/${projectId}/${fundamentalPath}/${tab.fundamentalId}`);

        // Update active fundamental state based on type
        useEditorStore.getState().setAutosaveEnabled(false);

        switch (tab.type) {
            case 'route':
                useEditorStore.getState().setActiveRouteId(tab.fundamentalId);
                useEditorStore.getState().setActiveScheduleId('');
                useEditorStore.getState().setActiveBlueprintId('');
                useEditorStore.getState().setActiveChatWindowId('');
                break;
            case 'schedule':
                useEditorStore.getState().setActiveRouteId('');
                useEditorStore.getState().setActiveScheduleId(tab.fundamentalId);
                useEditorStore.getState().setActiveBlueprintId('');
                useEditorStore.getState().setActiveChatWindowId('');
                break;
            case 'blueprint':
                useEditorStore.getState().setActiveRouteId('');
                useEditorStore.getState().setActiveScheduleId('');
                useEditorStore.getState().setActiveBlueprintId(tab.fundamentalId);
                useEditorStore.getState().setActiveChatWindowId('');
                break;
            case 'chatwindow':
                useEditorStore.getState().setActiveRouteId('');
                useEditorStore.getState().setActiveScheduleId('');
                useEditorStore.getState().setActiveBlueprintId('');
                useEditorStore.getState().setActiveChatWindowId(tab.fundamentalId);
                break;
        }

        // Loading state will be cleared by useRouteSetup when the new fundamental loads

        // Notify parent
        if (onTabChange) {
            onTabChange(tab);
        }
    };

    // Handle tab close
    const handleTabClose = (e: React.MouseEvent, tab: EditorTab) => {
        e.stopPropagation(); // Prevent tab activation

        if (!projectId) return;

        // Check if this is the last tab
        const remainingTabs = tabs.filter(t => t.id !== tab.id);

        // Disable autosave before tab switch
        useEditorStore.getState().setAutosaveEnabled(false);

        // Remove the tab
        removeTab(projectId, tab.id);

        // Notify parent
        if (onTabClose) {
            onTabClose(tab);
        }

        // If no tabs remain, navigate to project root
        if (remainingTabs.length === 0) {
            // Clear active states
            useEditorStore.getState().setActiveRouteId('');
            useEditorStore.getState().setActiveScheduleId('');
            useEditorStore.getState().setActiveBlueprintId('');
            useEditorStore.getState().setActiveChatWindowId('');

            router.replace(`/project/${projectId}`);
        } else {
            // Switch to the new active tab
            const newActiveTab = getActiveTab(projectId);
            if (newActiveTab) {
                // Set loading state
                useEditorStore.getState().setIsLoadingFlow(true);

                // Update URL without full navigation
                const fundamentalPath = newActiveTab.type === 'chatwindow' ? 'chat-window' : newActiveTab.type;
                router.replace(`/project/${projectId}/${fundamentalPath}/${newActiveTab.fundamentalId}`);

                // Update active fundamental state based on type
                switch (newActiveTab.type) {
                    case 'route':
                        useEditorStore.getState().setActiveRouteId(newActiveTab.fundamentalId);
                        useEditorStore.getState().setActiveScheduleId('');
                        useEditorStore.getState().setActiveBlueprintId('');
                        useEditorStore.getState().setActiveChatWindowId('');
                        break;
                    case 'schedule':
                        useEditorStore.getState().setActiveRouteId('');
                        useEditorStore.getState().setActiveScheduleId(newActiveTab.fundamentalId);
                        useEditorStore.getState().setActiveBlueprintId('');
                        useEditorStore.getState().setActiveChatWindowId('');
                        break;
                    case 'blueprint':
                        useEditorStore.getState().setActiveRouteId('');
                        useEditorStore.getState().setActiveScheduleId('');
                        useEditorStore.getState().setActiveBlueprintId(newActiveTab.fundamentalId);
                        useEditorStore.getState().setActiveChatWindowId('');
                        break;
                    case 'chatwindow':
                        useEditorStore.getState().setActiveRouteId('');
                        useEditorStore.getState().setActiveScheduleId('');
                        useEditorStore.getState().setActiveBlueprintId('');
                        useEditorStore.getState().setActiveChatWindowId(newActiveTab.fundamentalId);
                        break;
                }
            }
        }
    };

    const handleOpenDocs = async () => {
        setDocumentationType('general');
        openDocs('');
        try {
            await fetchCategories();
        } catch (error) {
            console.error('Failed to load documentation categories:', error);
        }
    };

    const handleFeedbackOpen = () => {
        setIsFeedbackOpen(true);
        setError(null);
        setSuccess(false);
    };

    const handleFeedbackClose = () => {
        setIsFeedbackOpen(false);
        setEmail(auth.user?.profile.email as string || '');
        setMessage('');
        setError(null);
        setSuccess(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !message.trim()) {
            setError('Please provide both email and message');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await sendFeedback(email, message);
            setSuccess(true);
            setMessage('');

            setTimeout(() => {
                handleFeedbackClose();
            }, 2000);
        } catch (err) {
            console.error('Feedback submission failed:', err);
            setError('Failed to send feedback. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            {/* Bar - same height as item-manager and dock tabs */}
            <div
                className="flex items-center gap-2 p-1 border-b dark:border-white/20 bg-white dark:bg-zinc-800"
                style={{ borderBottomColor: hexToRgba(accent_color, 0.5) }}
            >
                {/* Left side - Tabs */}
                <div className="flex flex-1 items-center gap-1 overflow-x-auto overflow-y-hidden scrollbar-thin min-w-0" ref={tabsContainerRef}>
                    {tabs.map((tab) => {
                        const Icon = getIcon(tab.type);
                        const isActive = activeTab?.id === tab.id;

                        return (
                            <div
                                key={tab.id}
                                data-tab-id={tab.id}
                                className="flex items-center gap-1.5 px-2 py-1 rounded text-xs whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer text-zinc-600 dark:text-zinc-400"
                                style={{
                                    minWidth: '100px',
                                    maxWidth: '200px',
                                    backgroundColor: isActive ? hexToRgba(accent_color, 0.2) : 'transparent',
                                    color: isActive ? accent_color : undefined
                                }}
                                onMouseEnter={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = hexToRgba(accent_color, 0.1);
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isActive) {
                                        e.currentTarget.style.backgroundColor = 'transparent';
                                    }
                                }}
                                title={tab.method ? `${tab.method} /${tab.name}` : tab.name}
                            >
                                <div
                                    onClick={() => handleTabClick(tab)}
                                    className="flex items-center gap-1.5 flex-1 min-w-0"
                                >
                                    <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                    {tab.method && (
                                        <span className="font-semibold flex-shrink-0">{tab.method}</span>
                                    )}
                                    <span className="truncate flex-1">{tab.method ? `/${tab.name}` : tab.name}</span>
                                </div>
                                <button
                                    onClick={(e) => handleTabClose(e, tab)}
                                    className="p-0.5 rounded hover:bg-zinc-200 dark:hover:bg-zinc-600 flex-shrink-0"
                                    title="Close tab"
                                >
                                    <XMarkIcon className="w-3 h-3" />
                                </button>
                            </div>
                        );
                    })}

                    {/* Create new tab button */}
                    {projectId && <TabCreateDropdown />}
                </div>

                {/* Separator */}
                <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-600 flex-shrink-0" />

                {/* Right side - Documentation and Feedback buttons */}
                <button
                    onClick={handleOpenDocs}
                    className="flex items-center gap-1.5 p-1 px-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors text-sm flex-shrink-0"
                    title="Documentation"
                >
                    <BookOpenIcon className="w-4 h-4" />
                    <span>Documentation</span>
                </button>

                {/* Separator */}
                <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-600 flex-shrink-0" />

                <button
                    onClick={handleFeedbackOpen}
                    className="flex items-center gap-1.5 p-1 px-2 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors text-sm flex-shrink-0"
                    style={{ color: accent_color }}
                    onMouseEnter={(e) => e.currentTarget.style.color = hexToRgba(accent_color, 0.8)}
                    onMouseLeave={(e) => e.currentTarget.style.color = accent_color}
                    title="Send feedback"
                >
                    <ChatBubbleBottomCenterTextIcon className="w-4 h-4" />
                    <span>Feedback</span>
                </button>
            </div>

            {/* Feedback Modal */}
            <Modal isOpen={isFeedbackOpen} onClose={handleFeedbackClose} title="Send Feedback">
                {success ? (
                    <div className="p-6 text-center">
                        <div className="text-green-600 dark:text-green-400 mb-2">
                            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-lg font-medium text-zinc-900 dark:text-white">
                            Feedback sent successfully!
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                            Thank you for your feedback.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Your Email
                            </label>
                            <Input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="your@email.com"
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                                Message
                            </label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Share your thoughts, report a bug, or request a feature..."
                                rows={6}
                                required
                                disabled={isSubmitting}
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3">
                            <Button
                                type="button"
                                onClick={handleFeedbackClose}
                                disabled={isSubmitting}
                                plain
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Sending...' : 'Send Feedback'}
                            </Button>
                        </div>
                    </form>
                )}
            </Modal>
        </>
    );
};

export default EditorTopBar;
