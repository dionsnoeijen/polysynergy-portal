import React from 'react';
import {NodeVariable} from "@/types/types";
import {BoltIcon} from "@heroicons/react/24/outline";
import Connector from "@/components/editor/nodes/connector";
import FakeConnector from "@/components/editor/nodes/fake-connector";
import interpretNodeVariableType from "@/utils/interpretNodeVariableType";

interface DictSubItemsProps {
    logic?: {
        shouldShowSubItems: boolean;
        isSubValueConnected: (nodeId: string, handle: string) => boolean;
        subItemProps: {
            variable: NodeVariable;
            nodeId: string;
            onlyIn?: boolean;
            onlyOut?: boolean;
            disabled?: boolean;
            groupId?: string;
            isMirror?: boolean;
            categoryMainTextColor?: string;
            categorySubTextColor?: string;
            isInService?: boolean;
        };
    };
}

const DictSubItems: React.FC<DictSubItemsProps> = ({ logic }) => {
    if (!logic?.shouldShowSubItems) {
        return null;
    }

    const {
        variable,
        nodeId,
        onlyIn = false,
        onlyOut = false,
        disabled = false,
        groupId,
        isMirror = false,
        categoryMainTextColor = 'text-sky-600 dark:text-white',
        categorySubTextColor = 'text-slate-400 dark:text-slate-500',
        isInService = false
    } = logic.subItemProps;

    return (
        <>
            {(variable.value as NodeVariable[]).map((item: NodeVariable, index: number) => {
                const type = interpretNodeVariableType(item);
                const subVariableConnected = logic.isSubValueConnected(nodeId, `${variable.handle}.${item.handle}`);
                
                return (
                    <div key={item.handle + '-' + index} className="flex items-center pl-6 pr-6 pt-1 relative">
                        {/* Input Connectors */}
                        {item.has_in && isMirror && !onlyOut && (
                            <FakeConnector in/>
                        )}
                        {item.has_in && !isMirror && !disabled && !onlyOut && (
                            <Connector
                                in
                                nodeId={nodeId}
                                handle={`${variable.handle}.${item.handle}`}
                                disabled={disabled || isInService}
                                groupId={groupId}
                                nodeVariableType={variable.dock?.in_type_override ?? type.validationType}
                            />
                        )}
                        
                        {/* Sub-item Content */}
                        <div className="flex items-center truncate text-sky-200 dark:text-white" title={`${variable.handle}.${item.handle}`}>
                            {/* Tree connector visual */}
                            <span className={categoryMainTextColor}>
                                {index === (variable.value as NodeVariable[]).length - 1 ? (
                                    <div className={"w-4 h-4"}>
                                        <div className="w-2 h-2 border-l border-b border-dotted border-white"></div>
                                    </div>
                                ) : (
                                    <div className={"w-4 h-4"}>
                                        <div className="w-2 h-2 border-l border-b border-dotted border-white"></div>
                                        <div className="w-2 h-2 border-l border-dotted border-white"></div>
                                    </div>
                                )}
                            </span>
                            
                            {/* Sub-item label and value */}
                            <span className={`${subVariableConnected ? 'text-orange-800 dark:text-yellow-300 flex items-center' : `${categorySubTextColor}`}`}>
                                {' ' + item.handle}: {subVariableConnected ? (
                                    <BoltIcon className={'w-4 h-4 text-orange-800 dark:text-yellow-300'} />
                                ) : (
                                    item.value as string
                                )}
                            </span>
                        </div>
                        
                        {/* Output Connectors */}
                        {item.has_out && !isMirror && !disabled && !onlyIn && (
                            <Connector
                                out
                                nodeId={nodeId}
                                handle={`${variable.handle}.${item.handle}`}
                                disabled={disabled || isInService}
                                groupId={groupId}
                                nodeVariableType={variable.dock?.out_type_override ?? type.validationType}
                            />
                        )}
                        {item.has_out && isMirror && !onlyIn && (
                            <FakeConnector out/>
                        )}
                    </div>
                );
            })}
        </>
    );
};

export default DictSubItems;