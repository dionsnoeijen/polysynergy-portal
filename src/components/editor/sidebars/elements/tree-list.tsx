import React from "react";
import {ChevronDownIcon, ChevronLeftIcon, PlusIcon} from "@heroicons/react/24/outline";
import {Fundamental, ListItemWithId} from "@/types/types";
import useEditorStore from "@/stores/editorStore";
import useTreeStateStore from "@/stores/treeStateStore";
import clsx from "clsx";

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

    const handleTreeToggle = () => {
        // Disable tree interactions during execution
        if (isExecuting) return;

        toggleTreeForProject(activeProjectId, fundamental);
        toggleOpen(!isOpen);
    }

    const getItemClassName = (item: T) => {
        const baseClasses =
            "flex items-center justify-between pl-2 transition-colors duration-200 group dark:hover:bg-sky-500 dark:hover:text-white";

        const isActive = activeItem === item.id;
        const isEditing = formEditingItem === item.id;

        const bgClass = isEditing
            ? "bg-sky-200 dark:bg-sky-200"
            : isActive
                ? "bg-sky-500 dark:bg-sky-500"
                : "odd:bg-sky-300/10 even:bg-white/90 dark:odd:bg-zinc-800 dark:even:bg-zinc-800/50";

        return `${baseClasses} ${bgClass}`;
    };

    return items.length > 0 ? (
        <div className="relative">
            {(isFormOpen || isLoadingFlow) && (
                <div className="absolute inset-0 z-10 bg-sky-50/80 dark:bg-black/40 cursor-not-allowed"/>
            )}
            <div className="mt-[10px]">
                <button
                    type="button"
                    onClick={handleTreeToggle}
                    className="w-full flex items-center shadow-sm justify-between border-t border-b border-sky-500/50 bg-white/90 p-1 pl-2 pr-2 dark:border-white/10 dark:bg-zinc-800 hover:bg-sky-50 dark:hover:bg-zinc-700/50 transition-colors cursor-pointer"
                    data-tour-id={dataTourId ?? null}
                >
                    <h4 className="text-sky-500 dark:text-white/70">{title}</h4>
                    {isOpen ? (
                        <ChevronDownIcon className="w-5 h-5 text-sky-500 dark:text-white/70"/>
                    ) : (
                        <ChevronLeftIcon className="w-5 h-5 text-sky-500 dark:text-white/70"/>
                    )}
                </button>

                <div className="relative">
                    <ul
                        className={`overflow-y-auto transition-all duration-300 ${
                            isOpen ? "max-h-[20rem]" : "max-h-0"
                        }`}
                    >
                        {items.map((item, index) => (
                            <li className={getItemClassName(item)} key={`tree-${index}-${item.id}`}>
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
                            className="border-t border-b border-sky-500/50 bg-white dark:bg-zinc-800 dark:border-white/10">
                            <button
                                disabled={addDisabled || Boolean(isExecuting) || isLoadingFlow}
                                onClick={(isExecuting || isLoadingFlow) ? () => {} : addButtonClick}
                                className={clsx(
                                    "w-full flex items-center justify-center p-1",
                                    "text-sky-500 dark:text-white/70",
                                    "hover:bg-sky-100/50 dark:hover:bg-white/10"
                                )}
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
                <div className="absolute inset-0 z-10  bg-sky-50/80 dark:bg-black/40 cursor-not-allowed"/>
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
                                ? "opacity-40 cursor-not-allowed border-sky-500/30 dark:border-white/20 bg-white/30 dark:bg-black/30"
                                : "border-sky-500 dark:border-white/50 bg-white/60 dark:bg-black/60 hover:bg-sky-100 dark:hover:bg-white/10 cursor-pointer"
                        )}
                    >
                        <span className={clsx(
                            addDisabled || isExecuting || isLoadingFlow
                                ? "text-sky-500/50 dark:text-white/30"
                                : "text-sky-500 dark:text-white"
                        )}>{title}</span>
                        <PlusIcon className={clsx(
                            "w-4 h-4",
                            addDisabled || isExecuting || isLoadingFlow
                                ? "text-sky-500/50 dark:text-white/30"
                                : "text-sky-500 dark:text-white/70"
                        )}/>
                    </button>
                )}
            </div>
        </div>
    );
}
