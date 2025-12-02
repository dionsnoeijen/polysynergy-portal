import React, { useState, useEffect } from "react";
import { Tab } from "@headlessui/react";
import { clsx } from "clsx";
import useEditorStore from "@/stores/editorStore";
import { ArrowRightEndOnRectangleIcon } from "@heroicons/react/24/outline";
import { useBranding } from "@/contexts/branding-context";
import { hexToRgba } from "@/utils/colorUtils";

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
    const { accent_color } = useBranding();

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
                <Tab.List
                    className="flex items-center gap-1 p-1 border-b dark:border-white/20 bg-white dark:bg-zinc-800"
                    style={{ borderBottomColor: hexToRgba(accent_color, 0.5) }}
                >
                    {/* Close button - clearly separated at the start */}
                    <button
                        onClick={toggleClose}
                        className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                        style={{ color: accent_color }}
                        onMouseEnter={(e) => e.currentTarget.style.color = hexToRgba(accent_color, 0.8)}
                        onMouseLeave={(e) => e.currentTarget.style.color = accent_color}
                        title="Close dock"
                    >
                        <ArrowRightEndOnRectangleIcon className="w-4 h-4" />
                    </button>

                    {/* Separator */}
                    <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-600" />

                    {/* Tabs */}
                    <div className="flex flex-1">
                        {tabs.map((tab, index) => {
                            const isSelected = selectedIndex === index;
                            return (
                                <Tab
                                    key={tab.name}
                                    disabled={tab.disabled}
                                    className={clsx(
                                        "flex-1 py-1 px-2 text-sm font-medium leading-5 text-center rounded-md transition-colors",
                                        "focus:outline-none",
                                        tab.disabled && "opacity-50 cursor-not-allowed"
                                    )}
                                    style={{
                                        backgroundColor: isSelected ? hexToRgba(accent_color, 0.2) : 'transparent',
                                        color: isSelected ? accent_color : hexToRgba(accent_color, 0.6)
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!isSelected) {
                                            e.currentTarget.style.backgroundColor = hexToRgba(accent_color, 0.1);
                                            e.currentTarget.style.color = accent_color;
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = isSelected ? hexToRgba(accent_color, 0.2) : 'transparent';
                                        e.currentTarget.style.color = isSelected ? accent_color : hexToRgba(accent_color, 0.6);
                                    }}
                                >
                                    {tab.name}
                                    {isExecuting && typeof isExecuting === 'string' && index === 1 && (
                                        <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-green-400"></span>
                                    )}
                                </Tab>
                            );
                        })}
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