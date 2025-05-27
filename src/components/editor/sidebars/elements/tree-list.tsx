import React from "react";
import {ChevronDownIcon, ChevronLeftIcon, PlusIcon} from "@heroicons/react/24/outline";
import {Fundamental, ListItemWithId} from "@/types/types";
import {Button} from "@/components/button";
import useEditorStore from "@/stores/editorStore";

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
    toggleOpen = () => {
    },
}: ListProps<T>): React.JSX.Element {
    const openTree = useEditorStore((state) => state.openTree);
    const closeTree = useEditorStore((state) => state.closeTree);
    const isOpen = useEditorStore((state) => state.isTreeOpen(fundamental));
    const isFormOpen = useEditorStore((state) => state.isFormOpen());

    const handleTreeToggle = (isOpen: boolean) => {
        if (isOpen) {
            closeTree(fundamental);
        } else {
            openTree(fundamental);
        }
        toggleOpen(!isOpen);
    }

    const getItemClassName = (item: T) => {
        const baseClasses =
            "flex items-center border-l border-r border-sky-500 dark:border-white/20 justify-between pl-2 transition-colors duration-200 group dark:hover:bg-sky-500 dark:hover:text-white";

        const isActive = activeItem === item.id;
        const isEditing = formEditingItem === item.id;

        const bgClass = isEditing
            ? "bg-sky-200 dark:bg-sky-200"
            : isActive
                ? "bg-sky-500 dark:bg-sky-500"
                : "odd:bg-zinc-200/80 even:bg-transparent dark:odd:bg-zinc-800 dark:even:bg-zinc-800/50";

        return `${baseClasses} ${bgClass}`;
    };

    return items.length > 0 ? (
        <div className="relative">
            {isFormOpen && (
                <div className="absolute inset-0 z-10 bg-black/50 cursor-not-allowed"/>
            )}
            <div className="mt-[10px]">
                <div
                    className={`flex items-center shadow-sm justify-between border border-sky-500 p-1 pl-2 pr-2 dark:border-white/20 dark:bg-zinc-800 rounded-md${
                        isOpen ? " rounded-bl-none rounded-br-none" : ""
                    }`}
                    data-tour-id={dataTourId ?? null}
                >
                    <h4>{title}</h4>
                    <button type="button" onClick={() => handleTreeToggle(isOpen)}>
                        {isOpen ? (
                            <ChevronDownIcon className="w-5 h-5"/>
                        ) : (
                            <ChevronLeftIcon className="w-5 h-5"/>
                        )}
                    </button>
                </div>

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
                        className={`transition-all duration-300 overflow-hidden ${
                            isOpen ? "max-h-12 opacity-100" : "max-h-0 opacity-0"
                        }`}
                    >
                        <div
                            className="flex items-center justify-between border-l border-b border-t border-r border-sky-500 dark:bg-zinc-800 dark:border-white/20 rounded-md rounded-tr-none rounded-tl-none">
                            <Button
                                disabled={addDisabled}
                                onClick={addButtonClick}
                                plain
                                className="w-full hover:cursor-pointer rounded-tr-none rounded-tl-none after:rounded-tl-none after:rounded-tr-none p-0 !px-0 !py-0"
                            >
                                <PlusIcon/>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    ) : (
        <div className="relative">
            {isFormOpen && (
                <div className="absolute inset-0 z-10 bg-black/40 cursor-not-allowed"/>
            )}
            <div className="mt-[10px]">
                {addButtonClick && (
                    <div>
                        <Button
                            disabled={addDisabled}
                            onClick={addButtonClick}
                            plain
                            data-tour-id={dataTourId ?? null}
                            className="w-full hover:cursor-pointer p-0 border border-dotted border-white/50"
                        >
                            {title} <PlusIcon/>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
