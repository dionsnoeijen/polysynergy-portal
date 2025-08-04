import React, { useState, useEffect } from "react";
import { Tab } from "@headlessui/react";
import { clsx } from "clsx";
import useEditorStore from "@/stores/editorStore";

// Import the existing components
import DockWrapper from "@/components/editor/sidebars/dock-wrapper";
import NodeOutput from "@/components/editor/sidebars/node-output";

type Props = React.ComponentPropsWithoutRef<"div"> & {
    toggleClose: () => void;
};

const DockTabs: React.FC<Props> = ({ toggleClose, ...restProps }) => {
    const isExecuting = useEditorStore((state) => state.isExecuting);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Auto-switch to Output tab when execution starts
    useEffect(() => {
        if (isExecuting && typeof isExecuting === 'string') {
            setSelectedIndex(1); // Switch to Output tab (index 1)
        }
    }, [isExecuting]);

    const tabs = [
        {
            name: "Variables",
            component: <DockWrapper toggleClose={toggleClose} />,
            disabled: false
        },
        {
            name: "Output",
            component: <NodeOutput />,
            disabled: false
        }
    ];

    return (
        <div {...restProps} className="absolute left-0 top-0 right-0 bottom-0 flex flex-col">
            <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
                <Tab.List className="flex p-1 border border-sky-500/50 dark:border-white/20 rounded-md bg-white dark:bg-zinc-800">
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
                </Tab.List>
                <Tab.Panels className="flex-1 overflow-hidden mt-2">
                    {tabs.map((tab, index) => (
                        <Tab.Panel
                            key={index}
                            className="h-full focus:outline-none relative"
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