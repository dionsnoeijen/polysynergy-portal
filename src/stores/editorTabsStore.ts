import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type EditorTab = {
    id: string;  // UUID of the tab itself
    type: 'route' | 'schedule' | 'blueprint' | 'chatwindow';
    fundamentalId: string;  // UUID of the route/schedule/blueprint/chatwindow
    name: string;  // Display name
    method?: string;  // For routes (GET, POST, etc.)
};

type EditorTabsState = {
    // Tabs organized by project ID
    tabsByProject: Record<string, EditorTab[]>;

    // Active tab ID per project
    activeTabByProject: Record<string, string>;

    // Actions
    addTab: (projectId: string, tab: EditorTab) => void;
    removeTab: (projectId: string, tabId: string) => void;
    setActiveTab: (projectId: string, tabId: string) => void;
    getTabsForProject: (projectId: string) => EditorTab[];
    getActiveTab: (projectId: string) => EditorTab | null;
    hasTab: (projectId: string, fundamentalId: string) => boolean;
    getTabByFundamentalId: (projectId: string, fundamentalId: string) => EditorTab | null;
};

const useEditorTabsStore = create<EditorTabsState>()(
    persist(
        (set, get) => ({
            tabsByProject: {},
            activeTabByProject: {},

            addTab: (projectId: string, tab: EditorTab) => {
                set((state) => {
                    const currentTabs = state.tabsByProject[projectId] || [];

                    // Check if tab with same fundamentalId already exists
                    const existingTab = currentTabs.find(t => t.fundamentalId === tab.fundamentalId);
                    if (existingTab) {
                        // Just activate the existing tab
                        return {
                            activeTabByProject: {
                                ...state.activeTabByProject,
                                [projectId]: existingTab.id
                            }
                        };
                    }

                    // Add new tab
                    return {
                        tabsByProject: {
                            ...state.tabsByProject,
                            [projectId]: [...currentTabs, tab]
                        },
                        activeTabByProject: {
                            ...state.activeTabByProject,
                            [projectId]: tab.id
                        }
                    };
                });
            },

            removeTab: (projectId: string, tabId: string) => {
                set((state) => {
                    const currentTabs = state.tabsByProject[projectId] || [];
                    const filteredTabs = currentTabs.filter(t => t.id !== tabId);

                    // If we're closing the active tab, activate another one
                    let newActiveTab = state.activeTabByProject[projectId];
                    if (newActiveTab === tabId) {
                        // Try to activate the tab to the right, or left, or none
                        const removedIndex = currentTabs.findIndex(t => t.id === tabId);
                        if (filteredTabs.length > 0) {
                            const nextIndex = Math.min(removedIndex, filteredTabs.length - 1);
                            newActiveTab = filteredTabs[nextIndex].id;
                        } else {
                            newActiveTab = '';
                        }
                    }

                    return {
                        tabsByProject: {
                            ...state.tabsByProject,
                            [projectId]: filteredTabs
                        },
                        activeTabByProject: {
                            ...state.activeTabByProject,
                            [projectId]: newActiveTab
                        }
                    };
                });
            },

            setActiveTab: (projectId: string, tabId: string) => {
                set((state) => ({
                    activeTabByProject: {
                        ...state.activeTabByProject,
                        [projectId]: tabId
                    }
                }));
            },

            getTabsForProject: (projectId: string) => {
                return get().tabsByProject[projectId] || [];
            },

            getActiveTab: (projectId: string) => {
                const activeTabId = get().activeTabByProject[projectId];
                if (!activeTabId) return null;

                const tabs = get().tabsByProject[projectId] || [];
                return tabs.find(t => t.id === activeTabId) || null;
            },

            hasTab: (projectId: string, fundamentalId: string) => {
                const tabs = get().tabsByProject[projectId] || [];
                return tabs.some(t => t.fundamentalId === fundamentalId);
            },

            getTabByFundamentalId: (projectId: string, fundamentalId: string) => {
                const tabs = get().tabsByProject[projectId] || [];
                return tabs.find(t => t.fundamentalId === fundamentalId) || null;
            }
        }),
        {
            name: 'editor-tabs-storage',  // unique name for localStorage key
            storage: createJSONStorage(() => localStorage),
        }
    )
);

export default useEditorTabsStore;
