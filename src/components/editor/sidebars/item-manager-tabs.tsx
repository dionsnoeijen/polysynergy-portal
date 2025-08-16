import React, { useState } from "react";
import { Tab } from "@headlessui/react";
import { clsx } from "clsx";
import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/24/outline";

// Import the item manager content component (without heading)
import ItemManagerContent from "@/components/editor/sidebars/item-manager-content";
import SidebarTenantHeader from "@/components/sidebar/sidebar-tenant-header";
import NodeHandlesContent from "@/components/editor/sidebars/node-handles-content";

// Node Variables / Handles component
const NodeVariables: React.FC = () => {
    return (
        <div className="h-full overflow-y-auto">
            <div className="mt-[10px]">
                <NodeHandlesContent />
            </div>
        </div>
    );
};

type Props = React.ComponentPropsWithoutRef<"div"> & {
    toggleClose: () => void;
};

const ItemManagerTabs: React.FC<Props> = ({ toggleClose, ...restProps }) => {
    const [selectedIndex, setSelectedIndex] = useState(0); // Always default to Items tab (index 0)

    const tabs = [
        {
            name: "Items",
            component: <ItemManagerContent />,
            disabled: false
        },
        {
            name: "Handles",
            component: <NodeVariables />,
            disabled: false
        }
    ];

    return (
        <div {...restProps} className="absolute left-0 top-0 right-0 bottom-0 flex flex-col">
            {/* Scrollable content area that contains everything except tenant header */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-2 mb-2">
                <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
                    <Tab.List className="flex items-center gap-1 p-1 border border-sky-500/50 dark:border-white/20 rounded-md bg-white dark:bg-zinc-800">
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
                                </Tab>
                            ))}
                        </div>
                        
                        {/* Separator */}
                        <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-600" />
                        
                        {/* Close button - clearly separated at the end */}
                        <button
                            onClick={toggleClose}
                            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 text-sky-500 dark:text-zinc-400 hover:text-sky-600 dark:hover:text-zinc-200 transition-colors"
                            title="Close panel"
                        >
                            <ArrowLeftEndOnRectangleIcon className="w-4 h-4" />
                        </button>
                    </Tab.List>
                    <Tab.Panels className="mt-0">
                        {tabs.map((tab, index) => (
                            <Tab.Panel
                                key={index}
                                className="focus:outline-none"
                            >
                                {tab.component}
                            </Tab.Panel>
                        ))}
                    </Tab.Panels>
                </Tab.Group>
            </div>
            
            {/* Tenant header AT THE BOTTOM OF THE CONTAINER - fixed position */}
            <div className="-mb-2">
                <SidebarTenantHeader />
            </div>
        </div>
    );
};

export default ItemManagerTabs;