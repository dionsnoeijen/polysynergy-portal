import React, { useState } from "react";
import {Text} from "@/components/text";
import {BoltIcon, InformationCircleIcon} from "@heroicons/react/24/outline";
import {NodeVariable} from "@/types/types";
import {ConfirmDialog} from "@/components/confirm-dialog";

const ValueConnected: React.FC<{
    variable: NodeVariable,
}> = ({
    variable
}): React.ReactElement => {
    const [showInfo, setShowInfo] = useState(false);

    return (
        <>
            <div className={'border border-orange-800 dark:border-white/20 flex items-center justify-between rounded-md w-full relative mt-3 pl-3 pr-1 pb-1 pt-1 bg-white/5 dark:bg-zinc-800'}>
                {variable?.info ? (
                    <button
                        onClick={() => setShowInfo(!showInfo)}
                        className="cursor-pointer hover:text-orange-600 dark:hover:text-yellow-200 text-left w-full"
                        title="Click for more info"
                    >
                        <Text className={'!text-orange-800 !dark:text-yellow-300 truncate'}>
                            <span className="truncate">{variable.name}</span>{' '}
                            <span className="text-zinc-600 dark:text-zinc-400 text-xs truncate">{'{'}{variable.handle}{'}'}</span>
                        </Text>
                    </button>
                ) : (
                    <Text className={'!text-orange-800 !dark:text-yellow-300 truncate'}>
                        <span className="truncate">{variable.name}</span>{' '}
                        <span className="text-zinc-600 dark:text-zinc-400 text-xs truncate">{'{'}{variable.handle}{'}'}</span>
                    </Text>
                )}
                
                <div className="flex items-center space-x-1">
                    {variable?.info && (
                        <button
                            onClick={() => setShowInfo(!showInfo)}
                            className={`p-1 rounded-md hover:bg-orange-600 ${showInfo && 'bg-orange-600'}`}
                            title={'Info'}
                        >
                            <InformationCircleIcon className="w-4 h-4 text-orange-800 dark:text-yellow-300"/>
                        </button>
                    )}
                    <BoltIcon className={'w-5 h-5 text-orange-800 dark:text-yellow-300'} />
                </div>
            </div>
            
            {variable?.info && (
                <ConfirmDialog
                    open={showInfo}
                    onClose={() => setShowInfo(false)}
                    title={'Info'}
                    description={variable.info}
                />
            )}
        </>
    );
};

export default ValueConnected;