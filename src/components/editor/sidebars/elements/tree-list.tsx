import React, { useState } from "react";
import { ChevronDownIcon, ChevronLeftIcon } from "@heroicons/react/16/solid";
import { ListItemWithId } from "@/types/types";

type ListProps<T extends ListItemWithId> = {
    items: T[];
    activeItem?: null | string;
    formEditingItem?: null | string;
    renderItem: (item: T) => React.ReactNode;
    addButton?: React.ReactNode;
    title?: string;
};

export default function TreeList<T extends ListItemWithId>({
    items,
    activeItem = null,
    formEditingItem = null,
    renderItem,
    addButton,
    title = "List",
}: ListProps<T>): React.JSX.Element {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="mt-[10px]">
            <div
                className={`flex items-center shadow-sm justify-between border-t border-l border-r border-sky-500 p-2 dark:border-white/20 dark:bg-zinc-900 rounded-md${
                    isOpen ? " rounded-bl-none rounded-br-none" : ""
                }`}
            >
                <h3 className="text-lg font-semibold">{title}</h3>
                <button type="button" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? (
                        <ChevronDownIcon className="w-5 h-5" />
                    ) : (
                        <ChevronLeftIcon className="w-5 h-5" />
                    )}
                </button>
            </div>

            <ul
                className={`overflow-hidden transition-all duration-300 ${
                    isOpen ? "max-h-screen" : "max-h-0"
                }`}
            >
                {items.map((item, index) => (
                    <li
                        className={`flex items-center border-l border-r border-sky-500 dark:border-white/20 justify-between pl-2 dark:hover:bg-sky-500 dark:hover:text-white ${
                            activeItem === item.id
                                ? "bg-zinc-300 dark:bg-zinc-950/90"
                                : "odd:bg-zinc-200/80 dark:odd:bg-zinc-950/30"
                        } ${
                            formEditingItem === item.id
                                ? "bg-sky-400 dark:bg-zinc-950"
                                : ""
                        } transition-colors duration-200 group`}
                        key={index}
                    >
                        {renderItem(item)}
                    </li>
                ))}
                {addButton && (
                    <li className="flex items-center justify-between border-l border-b border-r border-sky-500 dark:bg-zinc-900 dark:border-white/20 rounded-md rounded-tr-none rounded-tl-none">
                        {addButton}
                    </li>
                )}
            </ul>
        </div>
    );
}
