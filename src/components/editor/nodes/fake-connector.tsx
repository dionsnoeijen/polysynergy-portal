import React from "react";
import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { NodeVariableType } from "@/types/types";
import clsx from "clsx";

type FakeConnectorProps = {
    in?: boolean;
    out?: boolean;
    nodeVariableType?: NodeVariableType | string;
    className?: string;
    iconClassName?: string;
};

const FakeConnector: React.FC<FakeConnectorProps> = ({
    in: isIn,
    out: isOut,
    nodeVariableType,
    className,
    iconClassName,
}) => {
    let backgroundClasses;
    let iconColorClasses;

    if (nodeVariableType === NodeVariableType.TruePath) {
        backgroundClasses = "ring-white dark:ring-white bg-green-400 dark:bg-green-400";
        iconColorClasses = "text-zinc-800 dark:text-zinc-800";
    } else if (nodeVariableType === NodeVariableType.FalsePath) {
        backgroundClasses = "ring-white dark:ring-white bg-red-400 dark:bg-red-400";
        iconColorClasses = "text-zinc-800 dark:text-zinc-800";
    } else {
        backgroundClasses = "ring-sky-500 dark:ring-white bg-white dark:bg-zinc-800";
        iconColorClasses = "text-sky-600 dark:text-white";
    }

    const positionClasses = isIn
        ? "left-0 -translate-x-1/2"
        : isOut
        ? "right-0 translate-x-1/2"
        : "";

    return (
        <div
            className={clsx(
                "w-4 h-4 absolute rounded-full top-1/2 -translate-y-1/2 ring-1",
                backgroundClasses,
                positionClasses,
                className
            )}
        >
            <ChevronRightIcon
                className={clsx(
                    "w-5 h-5 absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
                    iconColorClasses,
                    iconClassName
                )}
            />
        </div>
    );
};

export default FakeConnector;