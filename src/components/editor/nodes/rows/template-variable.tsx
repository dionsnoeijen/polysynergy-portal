import React from "react";
import { NodeVariable } from "@/types/types";
import {BoltIcon, CodeBracketIcon} from "@heroicons/react/24/outline";
import Connector from "@/components/editor/nodes/connector";
import FakeConnector from "@/components/editor/nodes/fake-connector";
import interpretNodeVariableType from "@/utils/interpretNodeVariableType";
import useConnectionsStore from "@/stores/connectionsStore";

type Props = {
    variable: NodeVariable;
    nodeId: string;
    onlyIn?: boolean;
    onlyOut?: boolean;
    disabled?: boolean;
    groupId?: string;
    isMirror?: boolean;
};

const TemplateVariable: React.FC<Props> = ({
    variable,
    nodeId,
    onlyIn = false,
    onlyOut = false,
    disabled = false,
    groupId,
    isMirror = false,
}): React.ReactElement => {

    const isValueConnected = useConnectionsStore((state) => state.isValueConnected(nodeId, variable.handle));

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
                nodeVariableType={interpretNodeVariableType(variable).validationType}
            />}
            <div className="flex items-center truncate">
                <h3 className={`font-semibold truncate ${isValueConnected ? 'text-yellow-300 dark:text-yellow-300' : 'text-sky-600 dark:text-white'}`}>{variable.name}:</h3>
                <CodeBracketIcon className={`w-4 h-4 ml-1 ${isValueConnected ? 'text-yellow-300 dark:text-yellow-300' : 'text-sky-400 dark:text-slate-400'}`} />
                {isValueConnected ? <span className="ml-1"><BoltIcon className={'w-4 h-4 text-yellow-300'} /></span> : <span className="ml-1">{variable.value as string}</span>}
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
                <FakeConnector out/>
            )}
        </div>
    )
};

export default TemplateVariable;
