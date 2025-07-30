import React from "react";
import {NodeVariable} from "@/types/types";
import Connector from "@/components/editor/nodes/connector";
import FakeConnector from "@/components/editor/nodes/fake-connector";
import {BoltIcon, DocumentTextIcon} from "@heroicons/react/24/outline";
import useConnectionsStore from "@/stores/connectionsStore";
import interpretNodeVariableType from "@/utils/interpretNodeVariableType";

type Props = {
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

const RichTextAreaVariable: React.FC<Props> = ({
    variable,
    nodeId,
    onlyIn = false,
    onlyOut = false,
    disabled = false,
    groupId,
    isMirror = false,
    categoryMainTextColor = 'text-sky-600 dark:text-white',
    categorySubTextColor = 'text-sky-400 dark:text-slate-400',
isInService = false
}): React.ReactElement => {

    const isValueConnected = useConnectionsStore((state) => state.isValueConnected(nodeId, variable.handle));

    const validationType = interpretNodeVariableType(variable).validationType;

    return (
        <div
            className={`flex items-center justify-between rounded-md w-full pl-4 pr-4 pt-1 relative ${disabled && 'opacity-0'}`}>
            {variable.has_in && isMirror && !onlyOut && (
                <FakeConnector in/>
            )}
            {variable.has_in && !isMirror && !disabled && !onlyOut && <Connector
                in
                nodeId={nodeId}
                handle={variable.handle}
                disabled={disabled || isInService}
                groupId={groupId}
                nodeVariableType={validationType}
            />}
            {isValueConnected ? (
                    <>
                        <h3 className={`font-semibold truncate ${isValueConnected ? 'text-orange-800 dark:text-yellow-300' : `${categoryMainTextColor}`}`}>
                            {(groupId && variable.group_name_override) ? variable.group_name_override : variable.name}:
                        </h3>
                        <span className="ml-1"><BoltIcon className={'w-4 h-4 text-orange-800 dark:text-yellow-300'}/></span>
                    </>
                ) :
                (
                    <>
                        {variable.value ? (
                            <div className={`note-text ${categorySubTextColor}`}
                                 dangerouslySetInnerHTML={{__html: variable.value as string}}/>
                        ) : (
                            <>
                                <h3 className={`font-semibold truncate ${isValueConnected ? 'text-orange-800 dark:text-yellow-300' : `${categoryMainTextColor}`}`}>
                                    {(groupId && variable.group_name_override) ? variable.group_name_override : variable.name}:
                                </h3>
                                <DocumentTextIcon
                                    className={`w-4 h-4 ml-1 ${isValueConnected ? 'text-orange-800 dark:text-yellow-300' : `${categoryMainTextColor}`}`}/>
                            </>
                        )}
                    </>
                )}
            {variable.has_out && !isMirror && !disabled && !onlyIn && <Connector
                out
                nodeId={nodeId}
                handle={variable.handle}
                disabled={disabled || isInService}
                groupId={groupId}
                nodeVariableType={validationType}
            />}
            {variable.has_out && isMirror && !onlyIn && (
                <FakeConnector out/>
            )}
        </div>
    );
}

export default RichTextAreaVariable;
