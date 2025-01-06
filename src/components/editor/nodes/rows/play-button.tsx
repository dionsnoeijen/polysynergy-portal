import React from "react";
import { PlayCircleIcon } from "@heroicons/react/16/solid";
import { Button } from "@/components/button";

type Props = {
    nodeId: string;
    disabled?: boolean;
};

const PlayButton: React.FC<Props> = ({
    nodeId,
    disabled = false,
}: Props) => (
    <div className={`flex items-center justify-between rounded-md w-full pl-3 pr-3 pt-2 relative ${disabled && 'select-none opacity-0'}`}>
        <Button type={"button"} className={'block w-full'} onClick={() => {
            console.log(`play ${nodeId}`);
        }}><PlayCircleIcon className={'h-6 w-6'} /></Button>
    </div>
);

export default PlayButton;