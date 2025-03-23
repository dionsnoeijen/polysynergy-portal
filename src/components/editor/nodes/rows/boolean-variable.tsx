import React from "react";
import { NodeVariable } from "@/types/types";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/outline";
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

const BooleanVariable: React.FC<Props> = ({
    variable,
    nodeId,
    onlyIn = false,
    onlyOut = false,
    disabled = false,
    groupId,
    isMirror = false,
}) => (
    <div className={`flex items-center justify-between rounded-md w-full pl-5 pr-3 pt-1 relative ${disabled && 'select-none opacity-0'}`}>
        {variable.has_in && isMirror && !onlyOut && (
            <FakeConnector in />
        )}
        {variable.has_in && !isMirror && !disabled && !onlyOut && <Connector
            in
            nodeId={nodeId}
            handle={variable.handle}
            disabled={disabled}
            groupId={groupId}
            nodeVariableType={interpretNodeVariableType(variable).validationType}
        />}
        <div className="flex items-center truncate">
            <h3 className="font-semibold truncate text-sky-600 dark:text-white">{variable.name}:</h3>
            {variable.value ? (
                <CheckCircleIcon className="w-4 h-4 ml-1 text-sky-400 dark:text-slate-400" />
            ) : (
                <XCircleIcon className="w-4 h-4 ml-1 text-sky-400 dark:text-slate-400" />
            )}
        </div>
        {variable.has_out && !isMirror && !disabled && !onlyIn && <Connector
            out
            nodeId={nodeId}
            handle={variable.handle}
            disabled={disabled}
            groupId={groupId}
            nodeVariableType={interpretNodeVariableType(variable).validationType}
        />}
        {variable.has_out && isMirror && !onlyIn && (
            <FakeConnector out />
        )}
    </div>
);

export default BooleanVariable;
