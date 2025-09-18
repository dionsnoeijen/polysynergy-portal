import React from 'react';
import {useListVariableLogic} from '@/hooks/editor/nodes/variables/useListVariableLogic';

interface ListItemsProps {
    logic: ReturnType<typeof useListVariableLogic>;
}

const ListItems: React.FC<ListItemsProps> = ({ logic }) => {
    if (!logic.shouldShowList) {
        return null;
    }

    return (
        <>
            {logic.listItems.map((item, index) => (
                <div key={'list-' + index} className="flex items-center pl-6 pr-6 pt-1 relative">
                    <div className="flex items-center truncate" title={`${logic.variable.handle}.${item}`}>
                        <span className={logic.categorySubTextColor}>
                            {index === logic.listItems.length - 1 ? (
                                <div className={"w-4 h-4"}>
                                    <div className={`w-2 h-2 border-l border-b border-dotted ${logic.textColor.replace('text-', 'border-')}`}></div>
                                </div>
                            ) : (
                                <div className={"w-4 h-4"}>
                                    <div className={`w-2 h-2 border-l border-b border-dotted ${logic.textColor.replace('text-', 'border-')}`}></div>
                                    <div className={`w-2 h-2 border-l border-dotted ${logic.textColor.replace('text-', 'border-')}`}></div>
                                </div>
                            )}
                        </span>
                        <span className={logic.textColor}>{item as string}</span>
                    </div>
                </div>
            ))}
        </>
    );
};

export default ListItems;