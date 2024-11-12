import { ArrowLeftEndOnRectangleIcon, ArrowRightEndOnRectangleIcon } from "@heroicons/react/16/solid";
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
        <div className="default-editor-container flex items-center justify-between p-2">
            {arrowToLeft && <button type="button" onClick={toggleClose}><ArrowRightEndOnRectangleIcon className="w-4 h-4 text-white" /></button>}

            <h1 className="flex-grow text-center text-white">{children}</h1>

            {!arrowToLeft && <button type="button" onClick={toggleClose}><ArrowLeftEndOnRectangleIcon className="w-4 h-4 text-white" /></button>}
        </div>
    )
}
