import React, { useState, useEffect } from "react";
import { Tab } from "@headlessui/react";
import { clsx } from "clsx";
import useEditorStore from "@/stores/editorStore";
import { ArrowRightEndOnRectangleIcon } from "@heroicons/react/24/outline";

// Import the existing components
import DockWrapper from "@/components/editor/sidebars/dock-wrapper";
import NodeOutput from "@/components/editor/sidebars/node-output";

type Props = React.ComponentPropsWithoutRef<"div"> & {
    toggleClose: () => void;
};

const DockTabs: React.FC<Props> = ({ toggleClose, ...restProps }) => {
    const isExecuting = useEditorStore((state) => state.isExecuting);
    const chatMode = useEditorStore((state) => state.chatMode);
    const isReadOnly = useEditorStore((state) => state.isReadOnly);
    const [selectedIndex, setSelectedIndex] = useState(0); // Always default to Variables tab (index 0)

    // Listen for execution start event to switch to Output tab
    useEffect(() => {
        const handleSwitchToOutput = () => {
            console.log("🎯 DockTabs: Switching to Output tab (index 1)");
            setSelectedIndex(1);
        };

        window.addEventListener('switch-to-output-tab', handleSwitchToOutput);
        return () => window.removeEventListener('switch-to-output-tab', handleSwitchToOutput);
    }, []);

    // In chat mode OR read-only mode (/chat route), auto-select Output tab and only show Output
    useEffect(() => {
        if (chatMode || isReadOnly) {
            setSelectedIndex(0); // Will be the only tab (Output) in chat/read-only mode
        }
    }, [chatMode, isReadOnly]);

    const allTabs = [
        {
            name: "Variables",
            component: <div className="h-full flex flex-col"><DockWrapper toggleClose={toggleClose} /></div>,
            disabled: false
        },
        {
            name: "Output",
            component: <div className="h-full flex flex-col"><NodeOutput /></div>,
            disabled: false
        }
    ];

    // Filter tabs based on chat mode or read-only mode (/chat route)
    const tabs = (chatMode || isReadOnly) ? allTabs.filter(tab => tab.name === "Output") : allTabs;

    return (
        <div {...restProps} className="absolute left-0 top-0 right-0 bottom-0 flex flex-col">
            <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
                <Tab.List className="flex items-center gap-1 p-1 border-b border-sky-500/50 dark:border-white/20 bg-white dark:bg-zinc-800">
                    {/* Close button - clearly separated at the start */}
                    <button
                        onClick={toggleClose}
                        className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sky-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-zinc-200 transition-colors"
                        title="Close dock"
                    >
                        <ArrowRightEndOnRectangleIcon className="w-4 h-4" />
                    </button>
                    
                    {/* Separator */}
                    <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-600" />
                    
                    {/* Tabs */}
                    <div className="flex flex-1">
                        {tabs.map((tab, index) => (
                            <Tab
                                key={tab.name}
                                disabled={tab.disabled}
                                className={({ selected }) =>
                                    clsx(
                                        "flex-1 py-1 px-2 text-sm font-medium leading-5 text-center rounded-md transition-colors",
                                        "focus:outline-none",
                                        selected
                                            ? "bg-sky-500/20 dark:bg-zinc-700 text-sky-600 dark:text-white"
                                            : "text-sky-400 dark:text-gray-400 hover:text-sky-500 dark:hover:text-white hover:bg-sky-500/10 dark:hover:bg-zinc-700/50",
                                        tab.disabled && "opacity-50 cursor-not-allowed"
                                    )
                                }
                            >
                                {tab.name}
                                {isExecuting && typeof isExecuting === 'string' && index === 1 && (
                                    <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-green-400"></span>
                                )}
                            </Tab>
                        ))}
                    </div>
                </Tab.List>
                <Tab.Panels className="flex-1 mt-2">
                    {tabs.map((tab, index) => (
                        <Tab.Panel
                            key={index}
                            className="h-full focus:outline-none"
                        >
                            {tab.component}
                        </Tab.Panel>
                    ))}
                </Tab.Panels>
            </Tab.Group>
        </div>
    );
};

export default DockTabs;