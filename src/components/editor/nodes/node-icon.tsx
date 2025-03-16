import React from "react";
import clsx from "clsx";

const NodeIcon = ({className, icon}: { className?: string; icon: string }) => {
    return (
        <div
            className={clsx(
                "rounded inline-flex items-center justify-center overflow-hidden max-h-6 max-w-6",
                className,
            )}
        >
            <div
                className="h-full w-auto object-contain"
                dangerouslySetInnerHTML={{
                    __html: icon.replace(
                        "<svg",
                        `<svg style="width: 100%; height: 100%; object-fit: contain;"`
                    ).replace('<?xml version="1.0" encoding="UTF-8"?>', ''),
                }}
            />
        </div>
    );
};

export default NodeIcon;