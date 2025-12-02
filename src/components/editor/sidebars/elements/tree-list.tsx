import React from "react";
import {ChevronDownIcon, ChevronLeftIcon, PlusIcon} from "@heroicons/react/24/outline";
import {Fundamental, ListItemWithId} from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import useTreeStateStore from "@/stores/treeStateStore";
import clsx from "clsx";
import { useBranding } from "@/contexts/branding-context";

type ListProps<T extends ListItemWithId> = {
    items: T[];
    activeItem?: null | string;
    formEditingItem?: null | string;
    renderItem: (item: T) => React.ReactNode;
    addButtonClick?: () => void;
    addDisabled?: boolean;
    title?: string;
    fundamental: Fundamental;
    dataTourId: null | string;
    toggleOpen?: (isOpen: boolean) => void;
};

export default function TreeList<T extends ListItemWithId>({
    items,
    activeItem = null,
    formEditingItem = null,
    renderItem,
    addButtonClick,
    addDisabled = false,
    title = "List",
    fundamental,
    dataTourId = null,
    toggleOpen = () => {},
}: ListProps<T>): React.JSX.Element {
    const activeProjectId = useEditorStore((state) => state.activeProjectId);
    const isFormOpen = useEditorStore((state) => state.isFormOpen());
    const isExecuting = useEditorStore((state) => state.isExecuting);
    const isLoadingFlow = useEditorStore((state) => state.isLoadingFlow);

    const isOpen = useTreeStateStore((state) => state.isTreeOpenForProject(activeProjectId, fundamental));
    const toggleTreeForProject = useTreeStateStore((state) => state.toggleTreeForProject);

    const { accent_color } = useBranding();

    // Helper to convert hex to rgba
    const hexToRgba = (hex: string, opacity: number) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        if (!result) return `rgba(14, 165, 233, ${opacity})`;
        const r = parseInt(result[1], 16);
        const g = parseInt(result[2], 16);
        const b = parseInt(result[3], 16);
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    const handleTreeToggle = () => {
        // Disable tree interactions during execution
        if (isExecuting) return;

        toggleTreeForProject(activeProjectId, fundamental);
        toggleOpen(!isOpen);
    }

    const getItemStyle = (item: T, isOdd: boolean) => {
        const isActive = activeItem === item.id;
        const isEditing = formEditingItem === item.id;

        if (isEditing) {
            return { backgroundColor: hexToRgba(accent_color, 0.3) };
        }
        if (isActive) {
            return { backgroundColor: accent_color };
        }
        if (isOdd) {
            return { backgroundColor: hexToRgba(accent_color, 0.05) };
        }
        return { backgroundColor: 'rgba(255, 255, 255, 0.9)' };
    };

    return items.length > 0 ? (
        <div className="relative">
            {(isFormOpen || isLoadingFlow) && (
                <div
                    className="absolute inset-0 z-10 dark:bg-black/40 cursor-not-allowed"
                    style={{ backgroundColor: hexToRgba(accent_color, 0.15) }}
                />
            )}
            <div className="mt-[10px]">
                <button
                    type="button"
                    onClick={handleTreeToggle}
                    className="w-full flex items-center shadow-sm justify-between border-t border-b bg-white/90 p-1 pl-2 pr-2 dark:border-white/10 dark:bg-zinc-800 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer"
                    style={{
                        borderTopColor: hexToRgba(accent_color, 0.5),
                        borderBottomColor: hexToRgba(accent_color, 0.5),
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hexToRgba(accent_color, 0.1)}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)'}
                    data-tour-id={dataTourId ?? null}
                >
                    <h4 className="dark:text-white/70" style={{ color: accent_color }}>{title}</h4>
                    {isOpen ? (
                        <ChevronDownIcon className="w-5 h-5 dark:text-white/70" style={{ color: accent_color }}/>
                    ) : (
                        <ChevronLeftIcon className="w-5 h-5 dark:text-white/70" style={{ color: accent_color }}/>
                    )}
                </button>

                <div className="relative">
                    <ul
                        className={`overflow-y-auto transition-all duration-300 ${
                            isOpen ? "max-h-[20rem]" : "max-h-0"
                        }`}
                    >
                        {items.map((item, index) => (
                            <li
                                className="flex items-center justify-between pl-2 transition-colors duration-200 group dark:hover:text-white"
                                style={getItemStyle(item, index % 2 === 1)}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hexToRgba(accent_color, 0.5)}
                                onMouseLeave={(e) => {
                                    const style = getItemStyle(item, index % 2 === 1);
                                    e.currentTarget.style.backgroundColor = style.backgroundColor || '';
                                }}
                                key={`tree-${index}-${item.id}`}
                            >
                                {renderItem(item)}
                            </li>
                        ))}
                    </ul>
                </div>

                {addButtonClick && (
                    <div
                        className={clsx(
                            "transition-all duration-300 overflow-hidden",
                            isOpen ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
                        )}
                    >
                        <div
                            className="border-t border-b bg-white dark:bg-zinc-800 dark:border-white/10"
                            style={{
                                borderTopColor: hexToRgba(accent_color, 0.5),
                                borderBottomColor: hexToRgba(accent_color, 0.5)
                            }}
                        >
                            <button
                                disabled={addDisabled || Boolean(isExecuting) || isLoadingFlow}
                                onClick={(isExecuting || isLoadingFlow) ? () => {} : addButtonClick}
                                className="w-full flex items-center justify-center p-1 dark:text-white/70 dark:hover:bg-white/10"
                                style={{ color: accent_color }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = hexToRgba(accent_color, 0.1)}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <PlusIcon className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    ) : (
        <div className="relative">
            {(isFormOpen || isLoadingFlow) && (
                <div
                    className="absolute inset-0 z-10 dark:bg-black/40 cursor-not-allowed"
                    style={{ backgroundColor: hexToRgba(accent_color, 0.15) }}
                />
            )}
            <div className="mt-[10px]">
                {addButtonClick && (
                    <button
                        disabled={addDisabled || Boolean(isExecuting) || isLoadingFlow}
                        onClick={(isExecuting || isLoadingFlow) ? () => {} : addButtonClick}
                        data-tour-id={dataTourId ?? null}
                        className={clsx(
                            "w-full flex items-center justify-between gap-2 px-3 py-2",
                            "border-t border-b border-dotted",
                            "transition-all duration-200",
                            addDisabled || isExecuting || isLoadingFlow
                                ? "opacity-40 cursor-not-allowed dark:border-white/20 bg-white/30 dark:bg-black/30"
                                : "dark:border-white/50 bg-white/60 dark:bg-black/60 dark:hover:bg-white/10 cursor-pointer"
                        )}
                        style={{
                            borderColor: addDisabled || isExecuting || isLoadingFlow
                                ? hexToRgba(accent_color, 0.3)
                                : accent_color,
                        }}
                        onMouseEnter={(e) => {
                            if (!addDisabled && !isExecuting && !isLoadingFlow) {
                                e.currentTarget.style.backgroundColor = hexToRgba(accent_color, 0.1);
                            }
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.6)';
                        }}
                    >
                        <span
                            className={addDisabled || isExecuting || isLoadingFlow ? "dark:text-white/30" : "dark:text-white"}
                            style={{
                                color: addDisabled || isExecuting || isLoadingFlow
                                    ? hexToRgba(accent_color, 0.5)
                                    : accent_color
                            }}
                        >{title}</span>
                        <PlusIcon
                            className={clsx(
                                "w-4 h-4",
                                addDisabled || isExecuting || isLoadingFlow ? "dark:text-white/30" : "dark:text-white/70"
                            )}
                            style={{
                                color: addDisabled || isExecuting || isLoadingFlow
                                    ? hexToRgba(accent_color, 0.5)
                                    : accent_color
                            }}
                        />
                    </button>
                )}
            </div>
        </div>
    );
}
