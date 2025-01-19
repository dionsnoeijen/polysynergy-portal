import { ArrowLeftEndOnRectangleIcon, ArrowRightEndOnRectangleIcon } from "@heroicons/react/24/outline";
import React from "react";

export default function Heading({
    arrowToLeft = true,
    toggleClose,
    children
}: {
    arrowToLeft?: boolean,
    toggleClose?: () => void,
    children: React.ReactNode
}) {
    return (
        <div className="flex items-center justify-between p-2 border border-sky-500 dark:border-white/20 rounded-md dark:bg-zinc-800">
            {arrowToLeft && <button type="button" onClick={toggleClose}><ArrowRightEndOnRectangleIcon className="w-4 h-4 text-zinc-950 dark:text-white" /></button>}

            <h1 className="flex-grow text-center text-zinc-950 dark:text-white">{children}</h1>

            {!arrowToLeft && <button type="button" onClick={toggleClose}><ArrowLeftEndOnRectangleIcon className="w-4 h-4 text-zinc-950 dark:text-white" /></button>}
        </div>
    )
}
