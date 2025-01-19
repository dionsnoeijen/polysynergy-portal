import React from "react";
import { NodeVariable } from "@/types/types";
import Connector from "@/components/editor/nodes/connector";

type Props = {
    variable: NodeVariable;
    nodeId: string;
    onlyIn?: boolean;
    onlyOut?: boolean;
    disabled?: boolean;
    groupId?: string;
};

const TextAreaVariable: React.FC<Props> = ({
    variable,
    nodeId,
    onlyIn = false,
    onlyOut = false,
    disabled = false,
    groupId
}): React.ReactElement => (
    <div
        className={`flex items-center justify-between rounded-md w-full pl-5 pr-3 pt-1 relative ${disabled && 'opacity-0'}`}>
        {variable.has_in && !disabled && !onlyOut && <Connector
            in
            nodeId={nodeId}
            handle={variable.handle}
            disabled={disabled}
            groupId={groupId}
        />}
        <div className="flex items-center">
            <p className="break-words">{variable.value as string}</p>
        </div>
        {variable.has_out && !disabled && !onlyIn && <Connector
            out
            nodeId={nodeId}
            handle={variable.handle}
            disabled={disabled}
            groupId={groupId}
        />}
    </div>
);

export default TextAreaVariable;
