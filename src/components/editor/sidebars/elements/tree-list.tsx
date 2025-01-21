import React, { useState } from "react";
import {ChevronDownIcon, ChevronLeftIcon, PlusIcon} from "@heroicons/react/24/outline";
import { ListItemWithId } from "@/types/types";
import {Button} from "@/components/button";

type ListProps<T extends ListItemWithId> = {
    items: T[];
    activeItem?: null | string;
    formEditingItem?: null | string;
    renderItem: (item: T) => React.ReactNode;
    addButtonClick?: () => void;
    title?: string;
};

export default function TreeList<T extends ListItemWithId>({
    items,
    activeItem = null,
    formEditingItem = null,
    renderItem,
    addButtonClick,
    title = "List",
}: ListProps<T>): React.JSX.Element {
    const [isOpen, setIsOpen] = useState(true);

    return items.length > 0 ? (
        <div className="mt-[10px]">
            <div
                className={`flex items-center shadow-sm justify-between border-t border-l border-r border-sky-500 p-2 dark:border-white/20 dark:bg-zinc-800 rounded-md${
                    isOpen ? " rounded-bl-none rounded-br-none" : ""
                }`}
            >
                <h4>{title}</h4>
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
                                ? "bg-zinc-300 dark:bg-zinc-900"
                                : "odd:bg-zinc-200/80 dark:odd:bg-zinc-900"
                        } ${
                            formEditingItem === item.id
                                ? "bg-sky-400 dark:bg-zinc-900"
                                : ""
                        } transition-colors duration-200 group`}
                        key={index}
                    >
                        {renderItem(item)}
                    </li>
                ))}
                {addButtonClick && (
                    <li className="flex items-center justify-between border-l border-b border-t border-r border-sky-500 dark:bg-zinc-800 dark:border-white/20 rounded-md rounded-tr-none rounded-tl-none">
                        <Button
                            onClick={addButtonClick}
                            plain
                            className="w-full hover:cursor-pointer rounded-tr-none rounded-tl-none after:rounded-tl-none after:rounded-tr-none p-0"
                        >
                            <PlusIcon />
                        </Button>
                    </li>
                )}
            </ul>
        </div>
    ) : (
        <>
        {addButtonClick && (
            <div className={'mt-[10px]'}>
                <Button
                    onClick={addButtonClick}
                    plain
                    className="w-full hover:cursor-pointer p-0 border border-dotted border-white/50"
                >
                    {title}
                    <PlusIcon />
                </Button>
            </div>
        )}
        </>
    );
}
