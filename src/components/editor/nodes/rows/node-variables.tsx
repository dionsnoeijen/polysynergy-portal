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
import FileVariable from "@/components/editor/nodes/rows/file-variable";
import DependencyVariable from "@/components/editor/nodes/rows/dependency-variable";
import NodeVariablePlaceholder from "@/components/editor/nodes/rows/node-variable";
import TemplateVariable from "@/components/editor/nodes/rows/template-variable";
import AvatarVariable from "@/components/editor/nodes/rows/avatar-variable";
import ImageVariable from "@/components/editor/nodes/rows/image-variable";
import OAuthVariable from "@/components/editor/nodes/rows/oauth-variable";
import CodeVariable from "@/components/editor/nodes/rows/code-variable";

type Props = {
    node: Node;
    variables: {
        variable: NodeVariable | undefined,
        nodeId: string | undefined
    }[],
    isMirror?: boolean,
    onlyIn?: boolean,
    onlyOut?: boolean,
    categoryMainTextColor?: string,
    categorySubTextColor?: string
};

const NodeVariables: React.FC<Props> = ({
    node,
    variables,
    isMirror = false,
    onlyIn = false,
    onlyOut = false,
    categoryMainTextColor = 'text-slate-300',
    categorySubTextColor = 'text-slate-400'
}): React.ReactElement => {

    const { collapseConnections, openConnections } = useToggleConnectionCollapse(node);
    const getNodeVariableOpenState = useNodesStore((state) => state.getNodeVariableOpenState);
    const toggleNodeVariableOpenState = useNodesStore((state) => state.toggleNodeVariableOpenState);
    const isNodeInService = useNodesStore((state) => state.isNodeInService([node.id]));

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
                if (!variable) return null;
                // Allow node:false variables when used in group context (onlyIn/onlyOut)
                if (variable.node === false && !onlyIn && !onlyOut) return null;

                if (!nodeId) {
                    // In case of editing the node (by coding), there is no nodeId
                    nodeId = 'temp-id';
                }
                const isOpen = getNodeVariableOpenState(nodeId, variable.handle);
                return getVariableComponent(
                    variable,
                    isOpen,
                    handleToggle,
                    nodeId,
                    node,
                    isMirror,
                    onlyIn,
                    onlyOut,
                    categoryMainTextColor,
                    categorySubTextColor,
                    isNodeInService
                );
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
    onlyOut: boolean,
    categoryMainTextColor: string,
    categorySubTextColor?: string,
    isNodeInService: boolean = false
) => {
    const type = interpretNodeVariableType(variable);

    if (!type || !type.baseType) {
        return <span className="text-red-500">[Fout: unknown type]</span>;
    }

    // Make key unique based on render context to avoid duplicates in nested groups
    const keyPrefix = onlyIn ? 'in' : onlyOut ? 'out' : 'node';
    const key = `${keyPrefix}-${nodeId}-${variable.handle}`;

    const commonProps = {
        variable,
        isOpen,
        onToggle: handleToggle(variable.handle),
        nodeId,
        disabled: !isMirror && node.view.disabled,
        onlyIn,
        onlyOut,
        groupId: (onlyIn || onlyOut) ? node.id : undefined,
        isMirror,
        categoryMainTextColor,
        categorySubTextColor,
        isInService: isNodeInService
    };

    switch (type.baseType) {
        case NodeVariableType.Dict:
            return <DictVariable key={key} {...commonProps} />;
        case NodeVariableType.List:
            return <ListVariable key={key} {...commonProps} />;
        case NodeVariableType.String:
            return <StringVariable key={key} {...commonProps} />;
        case NodeVariableType.Any:
            return <StringVariable key={key} {...commonProps} />;
        case NodeVariableType.Json:
            return <JsonVariable key={key} {...commonProps} />;
        case NodeVariableType.Bytes:
            return <BytesVariable key={key} {...commonProps} />;
        case NodeVariableType.Number:
            return <NumberVariable key={key} {...commonProps} />;
        case NodeVariableType.DateTime:
            return <DatetimeVariable key={key} {...commonProps} />;
        case NodeVariableType.SecretString:
            return <SecretStringVariable key={key} {...commonProps} />;
        case NodeVariableType.TextArea:
            return <TextAreaVariable key={key} {...commonProps} />;
        case NodeVariableType.RichTextArea:
            return <RichTextAreaVariable key={key} {...commonProps} />;
        case NodeVariableType.Files:
            return <FileVariable key={key} {...commonProps} />;
        case NodeVariableType.Dependency:
            return <DependencyVariable key={key} {...commonProps} />;
        case NodeVariableType.Template:
            return <TemplateVariable key={key} {...commonProps} />;
        case NodeVariableType.Node:
            return <NodeVariablePlaceholder key={key} {...commonProps} />;
        case NodeVariableType.Avatar:
            return <AvatarVariable key={key} {...commonProps} />;
        case NodeVariableType.Image:
            return <ImageVariable key={key} {...commonProps} />;
        case NodeVariableType.OAuth:
            return <OAuthVariable key={key} {...commonProps} />;
        case NodeVariableType.Code:
            return <CodeVariable key={key} {...commonProps} />;
        case NodeVariableType.Boolean:
        case NodeVariableType.TruePath:
        case NodeVariableType.FalsePath:
            return <BooleanVariable key={key} {...commonProps} />;
        default:
            return null;
    }
};

export default NodeVariables;