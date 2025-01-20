import React from "react";
import { NodeVariable } from "@/types/types";
import Connector from "@/components/editor/nodes/connector";
import FakeConnector from "@/components/editor/nodes/fake-connector";

type Props = {
    variable: NodeVariable;
    nodeId: string;
    onlyIn?: boolean;
    onlyOut?: boolean;
    disabled?: boolean;
    groupId?: string;
    isMirror?: boolean;
};

const TextAreaVariable: React.FC<Props> = ({
    variable,
    nodeId,
    onlyIn = false,
    onlyOut = false,
    disabled = false,
    groupId,
    isMirror = false,
}): React.ReactElement => (
    <div className={`flex items-center justify-between rounded-md w-full pl-5 pr-3 pt-1 relative ${disabled && 'opacity-0'}`}>
        {variable.has_in && isMirror && !onlyOut && (
            <FakeConnector in />
        )}
        {variable.has_in && !isMirror && !disabled && !onlyOut && <Connector
            in
            nodeId={nodeId}
            handle={variable.handle}
            disabled={disabled}
            groupId={groupId}
        />}
        <div className="flex items-center">
            <p className="break-words">{variable.value as string}</p>
        </div>
        {variable.has_out && !isMirror && !disabled && !onlyIn && <Connector
            out
            nodeId={nodeId}
            handle={variable.handle}
            disabled={disabled}
            groupId={groupId}
        />}
        {variable.has_out && isMirror && !onlyIn && (
            <FakeConnector out />
        )}
    </div>
);

export default TextAreaVariable;
