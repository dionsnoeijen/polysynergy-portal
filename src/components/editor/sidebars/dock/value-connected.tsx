import React from "react";
import {Text} from "@/components/text";
import {BoltIcon} from "@heroicons/react/24/outline";
import {NodeVariable} from "@/types/types";

const ValueConnected: React.FC<{variable: NodeVariable}> = ({variable}): React.ReactElement => {
    return (
        // <div
        //     className={'border border-white/20 flex items-center justify-between rounded-md w-full relative mt-3 pl-3 pr-1 pb-1 pt-1 bg-white/5'}>
        //     <Text className={'!text-orange-800 !dark:text-yellow-300'}>{variable.name} <span
        //         className="text-zinc-500 dark:text-zinc-400 text-xs">{'{'}{variable.handle}{'}'}</span></Text>
        //     <BoltIcon className={'w-5 h-5 text-orange-800 dark:text-yellow-300'} />
        // </div>

        <div className={'border border-orange-800 dark:border-white/20 flex items-center justify-between rounded-md w-full relative mt-3 pl-3 pr-1 pb-1 pt-1 bg-white/5'}>
            <Text className={'!text-orange-800 !dark:text-yellow-300'}>{variable.name} <span className="text-zinc-600 dark:text-zinc-400 text-xs">{'{'}{variable.handle}{'}'}</span></Text>
            <BoltIcon className={'w-5 h-5 text-orange-800 dark:text-yellow-300'} />
        </div>
    );
};

export default ValueConnected;