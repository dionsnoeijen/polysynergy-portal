import React from "react";
import {NodeVariable} from "@/types/types";
import {HashtagIcon} from "@heroicons/react/24/outline";
import Connector from "@/components/editor/nodes/connector";
import FakeConnector from "@/components/editor/nodes/fake-connector";
import interpretNodeVariableType from "@/utils/interpretNodeVariableType";

type Props = {
    variable: NodeVariable;
    nodeId: string;
    onlyIn?: boolean;
    onlyOut?: boolean;
    disabled?: boolean;
    groupId?: string;
    isMirror?: boolean;
};

const NumberVariable: React.FC<Props> = ({
                                             variable,
                                             nodeId,
                                             onlyIn = false,
                                             onlyOut = false,
                                             disabled = false,
                                             groupId,
                                             isMirror = false,
                                         }) => {
    const value =
        typeof variable.value === "number"
            ? variable.value
            : typeof variable.value === "string" && !isNaN(parseFloat(variable.value))
                ? parseFloat(variable.value)
                : "";

    const type = interpretNodeVariableType(variable);

    return (
        <div
            className={`flex items-center justify-between rounded-md w-full pl-5 pr-3 pt-1 relative ${disabled && 'opacity-0'}`}>
            {variable.has_in && isMirror && !onlyOut && (
                <FakeConnector in/>
            )}
            {variable.has_in && !isMirror && !disabled && !onlyOut && <Connector
                in
                nodeId={nodeId}
                handle={variable.handle}
                disabled={disabled}
                groupId={groupId}
                nodeVariableType={type.baseType}
            />}
            <div className="flex items-center truncate">
                <h3 className="font-semibold truncate text-sky-600 dark:text-white">{variable.name}:</h3>
                <HashtagIcon className="w-4 h-4 ml-1 text-sky-400 dark:text-slate-400"/>
                <span className="ml-1">{value}</span>
            </div>
            {variable.has_out && !isMirror && !disabled && !onlyIn && <Connector
                out
                nodeId={nodeId}
                handle={variable.handle}
                disabled={disabled}
                groupId={groupId}
                nodeVariableType={type.baseType}
            />}
            {variable.has_out && isMirror && !onlyIn && (
                <FakeConnector out/>
            )}
        </div>
    )
};

export default NumberVariable;
