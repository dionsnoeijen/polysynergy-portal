import React from 'react';
import {useListVariableLogic} from '@/hooks/editor/nodes/variables/useListVariableLogic';
import {Bars3Icon, BoltIcon} from "@heroicons/react/24/outline";

interface ListHeaderProps {
    logic: ReturnType<typeof useListVariableLogic>;
}

const ListHeader: React.FC<ListHeaderProps> = ({ logic }) => {
    return (
        <>
            <h3 className={`font-semibold truncate ${logic.textColor}`}>
                {logic.displayName}:
            </h3>
            <Bars3Icon className={`w-4 h-4 ml-1 ${logic.iconColor}`} />
            {logic.isValueConnected ? (
                <span className="ml-1">
                    <BoltIcon className={'w-4 h-4 text-orange-800 dark:text-yellow-300'} />
                </span>
            ) : (
                <span className="ml-1">{logic.variable.value as string}</span>
            )}
        </>
    );
};

export default ListHeader;