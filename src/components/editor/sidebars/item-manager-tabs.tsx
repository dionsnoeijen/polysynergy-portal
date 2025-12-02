import React, { useState } from "react";
import { Tab } from "@headlessui/react";
import { clsx } from "clsx";
import { ArrowLeftEndOnRectangleIcon } from "@heroicons/react/24/outline";
import { useBranding } from "@/contexts/branding-context";
import { hexToRgba } from "@/utils/colorUtils";

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
    const { accent_color } = useBranding();

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
                    <Tab.List
                        className="flex items-center gap-1 p-1 border-b dark:border-white/20 bg-white dark:bg-zinc-800"
                        style={{ borderBottomColor: hexToRgba(accent_color, 0.5) }}
                    >
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
                                    </Tab>
                                );
                            })}
                        </div>

                        {/* Separator */}
                        <div className="w-px h-5 bg-zinc-300 dark:bg-zinc-600" />

                        {/* Close button - clearly separated at the end */}
                        <button
                            onClick={toggleClose}
                            className="p-1 rounded hover:bg-zinc-200 dark:hover:bg-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors"
                            style={{ color: accent_color }}
                            onMouseEnter={(e) => e.currentTarget.style.color = hexToRgba(accent_color, 0.8)}
                            onMouseLeave={(e) => e.currentTarget.style.color = accent_color}
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