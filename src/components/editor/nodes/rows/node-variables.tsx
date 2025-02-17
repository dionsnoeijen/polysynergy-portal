import {Node, NodeVariable, NodeVariableType} from "@/types/types";
import React from "react";
import interpretNodeVariableType from "@/utils/interpretNodeVariableType";
import DictVariable from "@/components/editor/nodes/rows/dict-variable";
import ListVariable from "@/components/editor/nodes/rows/list-variable";
import StringVariable from "@/components/editor/nodes/rows/string-variable";
import JsonVariable from "@/components/editor/nodes/rows/json-variable";
import BytesVariable from "@/components/editor/nodes/rows/bytes-variable";
import NumberVariable from "@/components/editor/nodes/rows/number-variable";
import DatetimeVariable from "@/components/editor/nodes/rows/datetime-variable";
import SecretStringVariable from "@/components/editor/nodes/rows/secret-string-variable";
import TextAreaVariable from "@/components/editor/nodes/rows/text-area-variable";
import RichTextAreaVariable from "@/components/editor/nodes/rows/rich-text-area-variable";
import BooleanVariable from "@/components/editor/nodes/rows/boolean-variable";
import useNodesStore from "@/stores/nodesStore";
import useToggleConnectionCollapse from "@/hooks/editor/nodes/useToggleConnectionCollapse";

type Props = {
    node: Node;
    variables: {
        variable: NodeVariable | undefined,
        nodeId: string | undefined
    }[],
    isMirror?: boolean,
    onlyIn?: boolean,
    onlyOut?: boolean,
};

const NodeVariables: React.FC<Props> = ({
    node,
    variables,
    isMirror = false,
    onlyIn = false,
    onlyOut = false,
}): React.ReactElement => {

    const { collapseConnections, openConnections } = useToggleConnectionCollapse(node);
    const getNodeVariableOpenState = useNodesStore((state) => state.getNodeVariableOpenState);
    const toggleNodeVariableOpenState = useNodesStore((state) => state.toggleNodeVariableOpenState);

    const handleToggle = (handle: string): (() => void) => {
        return () => {
            toggleNodeVariableOpenState(node.id, handle);
            if (!node.view.isOpenMap) return;
            if (node.view.isOpenMap[handle]) {
                collapseConnections(handle);
            } else {
                openConnections(handle);
            }
        };
    };

    return (
        <>
            {variables.map(({ variable, nodeId }) => {
                if (!variable || !nodeId) return null;
                const isOpen = getNodeVariableOpenState(nodeId, variable.handle);
                return getVariableComponent(variable, isOpen, handleToggle, nodeId, node, isMirror, onlyIn, onlyOut);
            })}
        </>
    );
}

const getVariableComponent = (
    variable: NodeVariable,
    isOpen: boolean,
    handleToggle: (handle: string) => () => void,
    nodeId: string,
    node: Node,
    isMirror: boolean,
    onlyIn: boolean,
    onlyOut: boolean
) => {
    const type = interpretNodeVariableType(variable);
    const commonProps = {
        key: `node-${nodeId}-${variable.handle}`,
        variable,
        isOpen,
        onToggle: handleToggle(variable.handle),
        nodeId,
        disabled: !isMirror && node.view.disabled,
        onlyIn,
        onlyOut,
        groupId: (onlyIn || onlyOut) ? node.id : undefined,
        isMirror,
    };

    switch (type.baseType) {
        case NodeVariableType.Dict:
            return <DictVariable {...commonProps} />;
        case NodeVariableType.List:
            return <ListVariable {...commonProps} />;
        case NodeVariableType.String:
            return <StringVariable {...commonProps} />;
        case NodeVariableType.Json:
            return <JsonVariable {...commonProps} />;
        case NodeVariableType.Bytes:
            return <BytesVariable {...commonProps} />;
        case NodeVariableType.Number:
            return <NumberVariable {...commonProps} />;
        case NodeVariableType.DateTime:
            return <DatetimeVariable {...commonProps} />;
        case NodeVariableType.SecretString:
            return <SecretStringVariable {...commonProps} />;
        case NodeVariableType.TextArea:
            return <TextAreaVariable {...commonProps} />;
        case NodeVariableType.RichTextArea:
            return <RichTextAreaVariable {...commonProps} />;
        case NodeVariableType.Boolean:
        case NodeVariableType.TruePath:
        case NodeVariableType.FalsePath:
            return <BooleanVariable {...commonProps} />;
        default:
            return null;
    }
};

export default NodeVariables;